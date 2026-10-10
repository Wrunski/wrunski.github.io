import { Composition } from 'remotion';
import { Mestre } from './Mestre';
import { ALTURA, DURACAO, LARGURA, QPS } from './tokens';

// O mestre do vídeo do Tem na Geladeira: 9:16 (1080×1920), 30 qps, 24 s. Os
// cortes de cada lugar saem dele na parte 2.
export const Root: React.FC = () => (
  <Composition
    id="mestre"
    component={Mestre}
    durationInFrames={DURACAO}
    fps={QPS}
    width={LARGURA}
    height={ALTURA}
  />
);
