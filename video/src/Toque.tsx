import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { VERDE } from './tokens';

// O toque visível: o simulador não desenha o dedo, então a camada vem daqui,
// sincronizada com a gravação pelo toques.json (o tempo e o ponto de cada
// toque, em pontos da tela do simulador). Um disco verde que assenta e um
// anel que se abre e some, como o retorno de toque de uma tela.
const DURA = 20; // quadros

export const Toque: React.FC<{ x: number; y: number; inicio: number; raio: number }> = ({
  x,
  y,
  inicio,
  raio,
}) => {
  const frame = useCurrentFrame();
  const t = frame - inicio;
  if (t < 0 || t > DURA) return null;
  const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
  const disco = interpolate(t, [0, 4], [0.55, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const discoSome = interpolate(t, [8, DURA], [0.5, 0], clamp);
  const anel = interpolate(t, [2, DURA], [1, 2.1], { ...clamp, easing: Easing.out(Easing.quad) });
  const anelSome = interpolate(t, [2, DURA], [0.85, 0], clamp);
  const base: React.CSSProperties = {
    position: 'absolute',
    left: x - raio,
    top: y - raio,
    width: raio * 2,
    height: raio * 2,
    borderRadius: '50%',
    pointerEvents: 'none',
  };
  return (
    <>
      <div
        style={{
          ...base,
          background: VERDE,
          opacity: discoSome,
          transform: `scale(${disco})`,
          boxShadow: '0 0 0 2px rgba(255, 255, 255, .9)',
        }}
      />
      <div
        style={{
          ...base,
          border: `${Math.max(2, raio * 0.09)}px solid ${VERDE}`,
          opacity: anelSome,
          transform: `scale(${anel})`,
        }}
      />
    </>
  );
};
