import { Composition } from 'remotion';
import { Cena3 } from './Cena3';
import { ALTURA, DURACAO, LARGURA, QPS } from './tokens';

// A prova da cena 3 do roteiro (VIDEO-APRESENTACAO-OPCOES.md, seção 4):
// 4:5 (1080×1350), 30 qps, 10 s.
export const Root: React.FC = () => (
  <Composition
    id="cena3"
    component={Cena3}
    durationInFrames={DURACAO}
    fps={QPS}
    width={LARGURA}
    height={ALTURA}
  />
);
