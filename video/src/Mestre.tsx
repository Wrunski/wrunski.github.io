import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Freeze,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import './fonte';
import { Celular, RAZAO_TELA, bezelDe } from './Celular';
import { Toque } from './Toque';
import gravacao from './toques.json';
import * as T from './tokens';

// O mestre do vídeo do Tem na Geladeira (a prova 2, 10/10/2026): o app numa
// moldura de celular em CSS, com a gravação de verdade do simulador e os
// toques visíveis. A câmera leva o olho ao que importa em cada cena, e tudo o
// que importa fica na faixa central de 4:5. Tudo em função do quadro (30 qps).

// A gravação (public/app.mp4) entra no quadro VIDEO_INICIO; cada toque do
// toques.json vira um quadro somando esse deslocamento.
export const VIDEO_INICIO = 36;
const VIDEO_ULTIMO = gravacao.quadros - 1;

// Os tempos, em quadros.
const SOBE = [0, 30] as const; // o celular sobe e assenta
const TITULO_SAI = [48, 66] as const; // o título e o subtítulo saem
const FAIXA_ENTRA = [54, 78] as const; // a faixa escura de baixo, com a legenda
const CENA1 = [78, 270] as const; // "Marque o que você tem em casa."
const CENA2 = [284, 366] as const; // "Veja o que dá para fazer agora."
const CENA3 = [380, 552] as const; // "Abra a receita e ajuste as porções."
const SAIDA = [558, 600] as const; // o celular desce e sai; a faixa some
const CHAMADA_ENTRA = [582, 612] as const; // "Baixe o beta"

// O celular em repouso: a tela de 560 px de largura. No começo, o topo da
// moldura em 600 px, abaixo do título; depois a câmera decide.
const TELA_W = 560;
const TELA_H = TELA_W * RAZAO_TELA;
const BZ = bezelDe(TELA_W);
const CX = T.LARGURA / 2;
const CY = 815; // o centro da janela em que a câmera enquadra a tela
const CEL_TOPO_INICIO = 600;
const FOCO_INICIO = (CY - CEL_TOPO_INICIO - BZ) / TELA_H;

// A câmera, por quadros-chave: a escala e o ponto da tela (0 em cima, 1
// embaixo) que fica no centro da janela. Entre dois quadros-chave, a
// transição é suave (ease in-out).
const CAMERA = [
  { f: 0, s: 1, foco: FOCO_INICIO },
  { f: 54, s: 1, foco: FOCO_INICIO },
  { f: 84, s: 1.3, foco: 0.7 }, // a Despensa: as linhas tocadas e o aviso no pé
  { f: 276, s: 1.3, foco: 0.7 },
  { f: 306, s: 1.25, foco: 0.33 }, // o Início: "Dá para fazer agora"
  { f: 372, s: 1.25, foco: 0.33 },
  { f: 402, s: 1.3, foco: 0.4 }, // a receita: o cartão, as porções e os ingredientes
  { f: 444, s: 1.3, foco: 0.4 },
  { f: 474, s: 1.5, foco: 0.4 }, // mais perto, nas porções
  { f: 558, s: 1.5, foco: 0.4 },
  { f: 600, s: 1, foco: FOCO_INICIO },
] as const;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const suave = Easing.inOut(Easing.cubic);
const desacelera = Easing.out(Easing.cubic);
const acelera = Easing.in(Easing.cubic);

const camera = (frame: number) => {
  let s = CAMERA[CAMERA.length - 1].s;
  let foco = CAMERA[CAMERA.length - 1].foco;
  if (frame <= CAMERA[0].f) {
    s = CAMERA[0].s;
    foco = CAMERA[0].foco;
  } else {
    for (let i = 1; i < CAMERA.length; i++) {
      const a = CAMERA[i - 1];
      const b = CAMERA[i];
      if (frame <= b.f) {
        const t = suave((frame - a.f) / (b.f - a.f));
        s = a.s + (b.s - a.s) * t;
        foco = a.foco + (b.foco - a.foco) * t;
        break;
      }
    }
  }
  // O ponto P da cena (o celular em repouso, com o topo da moldura em 0) fica
  // no centro da janela, com escala s.
  const pY = BZ + TELA_H * foco;
  return { s, tx: CX - CX * s, ty: CY - pY * s };
};

const entra = (frame: number, faixa: readonly [number, number], dy = 24) => ({
  opacity: interpolate(frame, faixa, [0, 1], { ...clamp, easing: desacelera }),
  transform: `translateY(${interpolate(frame, faixa, [dy, 0], { ...clamp, easing: desacelera })}px)`,
});

const sai = (frame: number, faixa: readonly [number, number], dy = -16) => ({
  opacity: interpolate(frame, faixa, [1, 0], { ...clamp, easing: acelera }),
  transform: `translateY(${interpolate(frame, faixa, [0, dy], { ...clamp, easing: acelera })}px)`,
});

// A legenda de uma cena: entra em 12 quadros, sai nos 10 últimos.
const legenda = (frame: number, faixa: readonly [number, number]) =>
  frame < faixa[1] - 10 ? entra(frame, [faixa[0], faixa[0] + 12]) : sai(frame, [faixa[1] - 10, faixa[1]]);

const Pilula: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div
    style={{
      display: 'inline-block',
      fontSize: 30,
      fontWeight: 600,
      lineHeight: 1.2,
      padding: '9px 22px',
      borderRadius: 999,
      background: T.VERDE,
      color: '#fff',
      ...style,
    }}
  >
    {T.TEXTO.titulo}
  </div>
);

export const Mestre: React.FC = () => {
  const frame = useCurrentFrame();
  const { s, tx, ty } = camera(frame);
  const sobe = interpolate(frame, SOBE, [160, 0], { ...clamp, easing: desacelera });
  const desce = interpolate(frame, SAIDA, [0, 1500], { ...clamp, easing: acelera });
  const quadroVideo = Math.min(Math.max(frame - VIDEO_INICIO, 0), VIDEO_ULTIMO);
  const faixa = interpolate(frame, [FAIXA_ENTRA[0], FAIXA_ENTRA[1], SAIDA[0], SAIDA[0] + 18], [0, 1, 1, 0], clamp);

  const cenas: { faixa: readonly [number, number]; texto: string }[] = [
    { faixa: CENA1, texto: T.TEXTO.cena1 },
    { faixa: CENA2, texto: T.TEXTO.cena2 },
    { faixa: CENA3, texto: T.TEXTO.cena3 },
  ];
  const cena = cenas.find((c) => frame >= c.faixa[0] && frame < c.faixa[1]);

  // Os toques, nas medidas da tela de 560 px: a gravação é em pontos.
  const kx = TELA_W / gravacao.tela.largura;
  const ky = TELA_H / gravacao.tela.altura;

  return (
    <AbsoluteFill
      style={{
        background: T.PRETO,
        fontFamily: T.FONTE,
        color: T.BRANCO,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* o halo verde atrás do celular, como no site */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(50% 40% at 50% 52%, ${T.HALO}, transparent 72%)`,
          opacity: interpolate(frame, [0, 40], [0, 1], clamp),
        }}
      />

      {/* a câmera: tudo o que está dentro aproxima e recua junto */}
      <AbsoluteFill
        style={{ transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: '0 0' }}
      >
        <div style={{ position: 'absolute', left: CX - (TELA_W / 2 + BZ), top: sobe + desce }}>
          <Celular largura={TELA_W}>
            <Freeze frame={quadroVideo}>
              <OffthreadVideo
                src={staticFile('app.mp4')}
                muted
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Freeze>
            {gravacao.toques.map((t) => (
              <Toque
                key={`${t.rotulo}-${t.tempo}`}
                x={t.x * kx}
                y={t.y * ky}
                inicio={VIDEO_INICIO + Math.round(t.tempo * T.QPS)}
                raio={TELA_W * 0.055}
              />
            ))}
          </Celular>
        </div>
      </AbsoluteFill>

      {/* o título e o subtítulo, já na tela no quadro 0 (o pôster) */}
      <div style={{ position: 'absolute', left: 84, right: 84, top: 330, ...sai(frame, TITULO_SAI, -28) }}>
        <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.025em' }}>
          {T.TEXTO.titulo}
        </div>
        <div style={{ marginTop: 16, fontSize: 42, fontWeight: 500, lineHeight: 1.3, color: T.CINZA }}>
          {T.TEXTO.subtitulo}
        </div>
      </div>

      {/* a faixa escura de baixo: a legenda só fica sobre o preto fechado,
          para nada da tela aparecer atrás dela (ajuste 1 da revisão) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1230,
          height: T.ALTURA - 1230,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.75) 50%, #000 100%)',
          opacity: faixa,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1380,
          height: T.ALTURA - 1380,
          background: T.PRETO,
          opacity: faixa,
        }}
      />

      {/* a etiqueta e a legenda da cena, dentro da faixa de 4:5 */}
      <div style={{ position: 'absolute', left: 84, right: 84, top: 1396, opacity: faixa }}>
        <Pilula />
        <div style={{ position: 'relative', height: 150, marginTop: 18 }}>
          {cena && (
            <div
              key={cena.texto}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                fontSize: 58,
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.015em',
                ...legenda(frame, cena.faixa),
              }}
            >
              {cena.texto}
            </div>
          )}
        </div>
      </div>

      {/* a chamada do fim */}
      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          top: 760,
          textAlign: 'center',
          ...entra(frame, CHAMADA_ENTRA, 30),
        }}
      >
        <Pilula />
        <div style={{ marginTop: 40, fontSize: 104, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
          {T.TEXTO.chamada}
        </div>
        <div style={{ marginTop: 22, fontSize: 46, fontWeight: 500, lineHeight: 1.3, color: T.CINZA_CLARO }}>
          {T.TEXTO.lojas}
        </div>
      </div>
    </AbsoluteFill>
  );
};
