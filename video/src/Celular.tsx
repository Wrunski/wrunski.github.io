import React from 'react';
import { BEZEL, RIM } from './tokens';

// A moldura de celular do site (css/site.css, .phone, .screen e .island),
// toda em CSS, sem o bezel da Apple: as medidas derivam da largura da tela
// (w), e a ilha cobre exatamente a que vem desenhada na gravação.
export const RAZAO_TELA = 2868 / 1320;

export const bezelDe = (w: number) => w * 0.038;

export const Celular: React.FC<{ largura: number; children: React.ReactNode }> = ({
  largura: w,
  children,
}) => {
  const bz = bezelDe(w);
  const botao: React.CSSProperties = {
    position: 'absolute',
    width: w * 0.013,
    background: BEZEL,
    borderRadius: 2,
    boxShadow: `inset 0 0 0 1px ${RIM}`,
  };
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        padding: bz,
        background: BEZEL,
        borderRadius: w * 0.17,
        boxShadow: `inset 0 0 0 1px ${RIM}, 0 0 0 1px rgba(0, 0, 0, .7)`,
      }}
    >
      <div style={{ ...botao, left: -w * 0.013, top: '20%', height: '15%' }} />
      <div style={{ ...botao, right: -w * 0.013, top: '24%', height: '11%' }} />
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: w,
          height: w * RAZAO_TELA,
          borderRadius: w * 0.132,
          background: '#000',
        }}
      >
        {children}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: w * 0.03,
            width: w * 0.3,
            height: w * 0.09,
            transform: 'translateX(-50%)',
            borderRadius: 999,
            background: '#000',
          }}
        />
      </div>
    </div>
  );
};
