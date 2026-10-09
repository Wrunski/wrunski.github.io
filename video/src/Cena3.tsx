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
import * as T from './tokens';

// A cena 3 do roteiro: o Tem na Geladeira numa moldura de celular em CSS; a
// câmera aproxima do "Dá para fazer agora", a gravação abre uma receita, e o
// contador chega ao número de testes. Tudo em função do quadro (30 qps).

// Os tempos, em quadros.
const SOBE = [0, 32] as const; // o celular sobe e assenta
const TITULO_SAI = [36, 54] as const; // o título e o subtítulo saem antes do zoom
const APROXIMA = [45, 87] as const; // a câmera aproxima da lista
const LEGENDA_ENTRA = [66, 84] as const; // a etiqueta e a legenda, na faixa de baixo
const VIDEO_INICIO = 15; // a gravação começa aqui: a receita abre no quadro 108
const VIDEO_ULTIMO = 199; // o último quadro limpo da receita; no 201 o laço volta ao Início
const RECUA = [126, 162] as const; // a câmera recua e enquadra a receita
const LEGENDA_SAI = [192, 204] as const;
const CONTADOR_ENTRA = [204, 218] as const;
const CONTAGEM = [204, 258] as const; // 0 → 1.296

// O celular, em repouso (escala 1): a tela de 520 px de largura, com o topo da
// moldura em 430 px. A parte de baixo passa da borda do quadro, de propósito.
const TELA_W = 520;
const TELA_H = TELA_W * RAZAO_TELA;
const BZ = bezelDe(TELA_W);
const CEL_TOPO = 430;
const TELA_TOPO = CEL_TOPO + BZ;
const CX = T.LARGURA / 2;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const suave = Easing.inOut(Easing.cubic);
const desacelera = Easing.out(Easing.cubic);
const acelera = Easing.in(Easing.cubic);

const comMilhar = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// A câmera: o ponto P da cena (coordenadas em repouso) fica no ponto C do
// quadro, com escala s. A aproximação mira a lista "Dá para fazer agora"
// (37% da altura da tela); o recuo, o cartão e os ingredientes da receita.
const camera = (frame: number) => {
  const t1 = interpolate(frame, APROXIMA, [0, 1], { ...clamp, easing: suave });
  const t2 = interpolate(frame, RECUA, [0, 1], { ...clamp, easing: suave });
  const deriva = interpolate(frame, [RECUA[1], T.DURACAO], [0, 0.035], clamp); // um empurrão lento até o fim
  const s = 1 + 0.8 * t1 - 0.5 * t2 + deriva;
  const pY = TELA_TOPO + TELA_H * (0.37 - 0.01 * t2);
  const base = TELA_TOPO + TELA_H * 0.37;
  const cY = base + (660 - base) * t1 + (560 - 660) * t2;
  return { s, tx: CX - CX * s, ty: cY - pY * s };
};

const entra = (frame: number, faixa: readonly [number, number], dy = 24) => ({
  opacity: interpolate(frame, faixa, [0, 1], { ...clamp, easing: desacelera }),
  transform: `translateY(${interpolate(frame, faixa, [dy, 0], { ...clamp, easing: desacelera })}px)`,
});

export const Cena3: React.FC = () => {
  const frame = useCurrentFrame();
  const { s, tx, ty } = camera(frame);
  const sobe = interpolate(frame, SOBE, [240, 0], { ...clamp, easing: desacelera });
  const quadroVideo = Math.min(Math.max(frame - VIDEO_INICIO, 0), VIDEO_ULTIMO);
  const testes = Math.round(
    interpolate(frame, CONTAGEM, [0, T.TESTES], { ...clamp, easing: desacelera }),
  );

  const titulo: React.CSSProperties = {
    opacity: interpolate(frame, TITULO_SAI, [1, 0], { ...clamp, easing: acelera }),
    transform: `translateY(${interpolate(frame, TITULO_SAI, [0, -28], { ...clamp, easing: acelera })}px)`,
  };
  const legendaSai = {
    opacity: interpolate(frame, LEGENDA_SAI, [1, 0], { ...clamp, easing: acelera }),
    transform: `translateY(${interpolate(frame, LEGENDA_SAI, [0, -16], { ...clamp, easing: acelera })}px)`,
  };
  const legendaEntra = entra(frame, LEGENDA_ENTRA);
  const legenda: React.CSSProperties =
    frame < LEGENDA_SAI[0] ? legendaEntra : legendaSai;

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
          background: `radial-gradient(44% 40% at 50% 62%, ${T.HALO}, transparent 72%)`,
          opacity: interpolate(frame, [0, 40], [0, 1], clamp),
        }}
      />

      {/* a câmera: tudo o que está dentro aproxima e recua junto */}
      <AbsoluteFill
        style={{ transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: '0 0' }}
      >
        <div style={{ position: 'absolute', left: CX - (TELA_W / 2 + BZ), top: CEL_TOPO + sobe }}>
          <Celular largura={TELA_W}>
            <Freeze frame={quadroVideo}>
              <OffthreadVideo
                src={staticFile('laco.mp4')}
                muted
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Freeze>
          </Celular>
        </div>
      </AbsoluteFill>

      {/* o título e o subtítulo, já na tela no quadro 0 */}
      <div style={{ position: 'absolute', left: 72, right: 72, top: 104, ...titulo }}>
        <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.025em' }}>
          {T.TEXTO.titulo}
        </div>
        <div
          style={{
            marginTop: 18,
            maxWidth: 900,
            fontSize: 36,
            fontWeight: 500,
            lineHeight: 1.3,
            color: T.CINZA,
          }}
        >
          {T.TEXTO.subtitulo}
        </div>
      </div>

      {/* a faixa escura de baixo, para a legenda ficar legível sobre a tela */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 800,
          height: T.ALTURA - 800,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,.6) 25%, rgba(0,0,0,.94) 45%, #000 60%)',
          opacity: interpolate(frame, [54, 78], [0, 1], clamp),
        }}
      />

      {/* a etiqueta e a legenda (ou o contador), fora dos 12% de baixo */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          bottom: Math.round(T.ALTURA * 0.12),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 22,
        }}
      >
        <div
          style={{
            ...legendaEntra,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.2,
            padding: '9px 22px',
            borderRadius: 999,
            background: T.VERDE,
            color: '#fff',
          }}
        >
          {T.TEXTO.titulo}
        </div>
        <div style={{ position: 'relative', width: '100%', height: 180 }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              fontSize: 50,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.015em',
              ...legenda,
            }}
          >
            {T.TEXTO.legenda.map((linha) => (
              <div key={linha}>{linha}</div>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 0, bottom: 0, ...entra(frame, CONTADOR_ENTRA, 16) }}>
            <div
              style={{
                fontSize: 120,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {comMilhar(testes)}
            </div>
            <div style={{ marginTop: 10, fontSize: 44, fontWeight: 500, lineHeight: 1.2, color: T.CINZA_CLARO }}>
              {T.TEXTO.contador}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
