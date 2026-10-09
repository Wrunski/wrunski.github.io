// A Inter, a mesma do site, carregada do arquivo (public/fontes), e não da
// rede: o render fica igual em qualquer máquina. O loadFont segura o render
// até a fonte estar pronta.
import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

export const fontePronta = loadFont({
  family: 'Inter',
  url: staticFile('fontes/InterVariable.woff2'),
  format: 'woff2',
  weight: '100 900',
});
