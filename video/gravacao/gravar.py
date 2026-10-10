#!/usr/bin/env python3
"""Grava a cena do Tem na Geladeira no simulador do iOS, com os toques por script.

    python3 gravar.py --simulador <udid> --saida <pasta> [--wda http://localhost:8100]
                      [--bundle com.wrunski.temnageladeira] [--so-preparar]

Precisa do simulador ligado, do app instalado nele (limpo: sem despensa gravada,
para a tela de primeira abertura aparecer) e do WebDriverAgent (WDA) servindo
no simulador (ver wda-sim.sh). Nada aqui liga o simulador nem sobe o WDA: as
duas coisas são pesadas e saem da mão de quem roda, com o saude antes.

O que faz, na ordem:
1. Abre o app pelo WDA e, na tela de primeira abertura, marca os básicos de
   exemplo (sal, alho, pimenta-do-reino, cebola, óleo, azeite, manteiga,
   açúcar, farinha de trigo, arroz, leite, limão e tomate) e toca em "Pronto".
   São dados de exemplo do próprio catálogo do app, nada pessoal.
2. Põe a barra de status limpa (9:41, bateria cheia) e começa a gravar com o
   `xcrun simctl io recordVideo` (resolução nativa, 1320×2868 no Pro Max).
3. Toca, com pausas de gente: a aba Despensa, "frango" e "ovo" (o aviso
   "+N receitas para fazer agora" aparece no pé), a aba Início (a lista "Dá
   para fazer agora" mudou), a receita "Ovos com tomate à chinesa" e duas vezes
   "Mais porções" (2 → 4 porções, as quantidades dobram).
4. Para a gravação, devolve a barra de status e grava toques.json: cada toque
   com o tempo em segundos desde o começo da gravação e o ponto em pontos da
   tela (440×956 no Pro Max), para a camada de toques do Remotion.

Saída: <pasta>/app.mov (a gravação crua) e <pasta>/toques.json.
"""

import argparse
import json
import os
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.request

BASICOS = [
    'sal', 'alho', 'pimenta-do-reino', 'cebola', 'óleo', 'azeite', 'manteiga',
    'açúcar', 'farinha de trigo', 'arroz', 'leite', 'limão', 'tomate',
]

# A coreografia gravada: (pausa antes, em segundos; o que tocar). O "aba" acha
# o rótulo mais baixo na tela (a barra de abas, e não o título da tela).
ROTEIRO = [
    (1.6, 'aba', 'Despensa'),
    (1.8, 'rotulo', 'frango'),
    (1.8, 'rotulo', 'ovo'),
    (2.8, 'aba', 'Início'),
    (2.4, 'contem', 'Ovos com tomate à chinesa'),
    (2.4, 'rotulo', 'Mais porções'),
    (1.1, 'rotulo', 'Mais porções'),
    (2.6, 'fim', ''),
]

# Quanto o toque demora para acontecer depois do pedido HTTP (medido no WDA:
# o pedido volta uns 100 a 200 ms depois do toque; o toque fica perto do
# começo desse intervalo).
ATRASO_TOQUE = 0.08


def passo(msg):
    print(f'→ {msg}', flush=True)


def erro(msg):
    print(f'✗ {msg}', file=sys.stderr, flush=True)
    sys.exit(1)


class Wda:
    def __init__(self, base):
        self.base = base.rstrip('/')
        self.sessao = None

    def pedir(self, metodo, caminho, corpo=None, tempo=60):
        dados = None if corpo is None else json.dumps(corpo).encode()
        req = urllib.request.Request(self.base + caminho, data=dados, method=metodo)
        req.add_header('Content-Type', 'application/json')
        try:
            with urllib.request.urlopen(req, timeout=tempo) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            try:
                return json.loads(e.read().decode())
            except Exception:
                raise RuntimeError(f'{metodo} {caminho}: HTTP {e.code}') from e

    def status(self):
        return self.pedir('GET', '/status', tempo=10)

    def abrir(self, bundle):
        caps = {
            'capabilities': {
                'alwaysMatch': {'bundleId': bundle, 'shouldWaitForQuiescence': False},
                'firstMatch': [{}],
            }
        }
        r = self.pedir('POST', '/session', caps, tempo=120)
        self.sessao = r.get('sessionId') or r.get('value', {}).get('sessionId')
        if not self.sessao:
            raise RuntimeError(f'o WDA não abriu a sessão: {r}')
        # Sem esperar o app "sossegar" a cada toque: as animações do app não
        # podem atrasar a coreografia.
        self.pedir('POST', f'/session/{self.sessao}/appium/settings',
                   {'settings': {'waitForIdleTimeout': 0.3, 'animationCoolOffTimeout': 0}})

    def elementos(self, predicado):
        r = self.pedir('POST', f'/session/{self.sessao}/elements',
                       {'using': 'predicate string', 'value': predicado})
        return [e.get('ELEMENT') or e.get('element-6066-11e4-a52e-4f735466cecf') for e in r.get('value') or []]

    def rect(self, e):
        r = self.pedir('GET', f'/session/{self.sessao}/element/{e}/rect')
        v = r['value']
        return v['x'], v['y'], v['width'], v['height']

    def tocar_xy(self, x, y):
        r = self.pedir('POST', f'/session/{self.sessao}/wda/tap', {'x': x, 'y': y})
        if isinstance(r.get('value'), dict) and r['value'].get('error'):
            raise RuntimeError(f'o WDA recusou o toque em ({x}, {y}): {r["value"]}')

    def arrastar(self, x1, y1, x2, y2, dur=0.5):
        self.pedir('POST', f'/session/{self.sessao}/wda/dragfromtoforduration',
                   {'fromX': x1, 'fromY': y1, 'toX': x2, 'toY': y2, 'duration': dur})

    def tela(self):
        r = self.pedir('GET', f'/session/{self.sessao}/window/size')
        return r['value']['width'], r['value']['height']


def escapar(s):
    return s.replace("'", "\\'")


class Gravador:
    def __init__(self, wda, udid):
        self.wda = wda
        self.udid = udid
        self.largura, self.altura = wda.tela()
        self.toques = []
        self.t0 = None

    # ---- achar e tocar -------------------------------------------------
    def achar(self, modo, texto, baixo=False):
        if modo == 'contem':
            pred = f"label CONTAINS '{escapar(texto)}' AND visible == 1"
        else:
            pred = f"label == '{escapar(texto)}' AND visible == 1"
        els = self.wda.elementos(pred)
        if not els:
            return None
        rects = [self.wda.rect(e) for e in els]
        # Só o que está dentro da tela, inteiro.
        dentro = [r for r in rects if r[1] >= 0 and r[1] + r[3] <= self.altura and r[3] > 0]
        if not dentro:
            return None
        dentro.sort(key=lambda r: r[1])
        r = dentro[-1] if baixo else dentro[0]
        return (r[0] + r[2] / 2, r[1] + r[3] / 2)

    def rolar(self, para_baixo=True, fracao=0.45):
        x = self.largura / 2
        y1 = self.altura * (0.72 if para_baixo else 0.3)
        y2 = y1 - self.altura * fracao * (1 if para_baixo else -1)
        self.wda.arrastar(x, y1, x, y2, 0.6)
        time.sleep(0.6)

    def achar_rolando(self, modo, texto, baixo=False, tentativas=8):
        for i in range(tentativas):
            p = self.achar(modo, texto, baixo)
            if p:
                return p
            self.rolar(True)
        # Volta ao topo e tenta uma vez mais.
        for _ in range(tentativas):
            self.rolar(False)
        return self.achar(modo, texto, baixo)

    def tocar(self, modo, texto, baixo=False, gravar=True):
        p = self.achar(modo, texto, baixo) if gravar else self.achar_rolando(modo, texto, baixo)
        if not p:
            raise RuntimeError(f'não achei "{texto}" na tela')
        x, y = p
        t_envio = time.monotonic()
        self.wda.tocar_xy(x, y)
        t_volta = time.monotonic()
        if gravar and self.t0 is not None:
            self.toques.append({
                'rotulo': texto,
                'tempo': round(t_envio - self.t0 + ATRASO_TOQUE, 3),
                'x': round(x, 1),
                'y': round(y, 1),
                'ida_e_volta': round(t_volta - t_envio, 3),
            })
        passo(f'toquei em "{texto}" ({x:.0f}, {y:.0f})' + (f' em {t_envio - self.t0:.2f}s' if self.t0 else ''))

    # ---- a primeira abertura --------------------------------------------
    def preparar(self):
        time.sleep(2.5)  # a abertura do app e a tela de primeira abertura
        if not self.achar('rotulo', 'Pronto'):
            # Já tem despensa gravada: o app abriu nas abas. Gravar assim
            # mudaria a cena; melhor começar limpo.
            raise RuntimeError('a tela de primeira abertura não apareceu: reinstale o app (simctl uninstall e install) para começar limpo')
        passo('primeira abertura: marcando os básicos de exemplo')
        for nome in BASICOS:
            self.tocar('rotulo', nome, gravar=False)
            time.sleep(0.25)
        for _ in range(6):
            self.rolar(False)
        self.tocar('rotulo', 'Pronto', gravar=False)
        time.sleep(1.5)
        if not self.achar('rotulo', 'Dá para fazer agora'):
            raise RuntimeError('depois do "Pronto", o Início não apareceu')
        passo('o app está no Início, com a despensa de exemplo')

    # ---- a gravação -------------------------------------------------------
    def barra_de_status(self, limpar=False):
        if limpar:
            subprocess.run(['xcrun', 'simctl', 'status_bar', self.udid, 'clear'], check=False)
            return
        subprocess.run(['xcrun', 'simctl', 'status_bar', self.udid, 'override', '--time', '9:41',
                        '--dataNetwork', 'wifi', '--wifiMode', 'active', '--wifiBars', '3',
                        '--cellularMode', 'active', '--cellularBars', '4', '--operatorName', '',
                        '--batteryState', 'charged', '--batteryLevel', '100'], check=True)

    def gravar(self, saida):
        mov = os.path.join(saida, 'app.mov')
        if os.path.exists(mov):
            os.remove(mov)
        self.barra_de_status()
        time.sleep(0.8)
        passo('gravando')
        proc = subprocess.Popen(['xcrun', 'simctl', 'io', self.udid, 'recordVideo', '--codec=h264',
                                 '--mask=ignored', '--force', mov],
                                stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True)
        try:
            inicio = time.monotonic()
            while True:
                linha = proc.stderr.readline()
                if 'Recording started' in linha:
                    self.t0 = time.monotonic()
                    break
                if proc.poll() is not None or time.monotonic() - inicio > 30:
                    raise RuntimeError(f'a gravação não começou: {linha.strip()}')
            for pausa, modo, texto in ROTEIRO:
                time.sleep(pausa)
                if modo == 'fim':
                    break
                self.tocar(modo, texto, baixo=(modo == 'aba'))
                if modo == 'aba':
                    pass
            duracao = time.monotonic() - self.t0
        finally:
            proc.send_signal(signal.SIGINT)
            try:
                proc.wait(timeout=30)
            except subprocess.TimeoutExpired:
                proc.kill()
            self.barra_de_status(limpar=True)
        if not os.path.exists(mov) or os.path.getsize(mov) == 0:
            raise RuntimeError('o simctl não escreveu a gravação')
        with open(os.path.join(saida, 'toques.json'), 'w', encoding='utf-8') as f:
            json.dump({
                'tela': {'largura': self.largura, 'altura': self.altura},
                'duracao': round(duracao, 3),
                'toques': self.toques,
            }, f, ensure_ascii=False, indent=2)
            f.write('\n')
        passo(f'gravado: {mov} ({os.path.getsize(mov) // 1024} KB, {duracao:.1f}s, {len(self.toques)} toques)')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--simulador', required=True, help='o udid do simulador ligado')
    ap.add_argument('--saida', required=True, help='a pasta de saída (app.mov e toques.json)')
    ap.add_argument('--wda', default='http://localhost:8100')
    ap.add_argument('--bundle', default='com.wrunski.temnageladeira')
    ap.add_argument('--so-preparar', action='store_true', help='só a primeira abertura, sem gravar')
    args = ap.parse_args()
    os.makedirs(args.saida, exist_ok=True)

    wda = Wda(args.wda)
    try:
        st = wda.status()
    except Exception as e:
        erro(f'o WDA não responde em {args.wda}: {e}')
    if not (st.get('value') or {}).get('ready', True):
        erro(f'o WDA não está pronto: {st}')
    passo(f'abrindo {args.bundle} pelo WDA')
    wda.abrir(args.bundle)
    g = Gravador(wda, args.simulador)
    passo(f'tela de {g.largura:.0f}×{g.altura:.0f} pontos')
    g.preparar()
    if args.so_preparar:
        return
    g.gravar(args.saida)


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as e:
        erro(str(e))
