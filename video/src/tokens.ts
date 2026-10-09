// Os tokens do site (css/site.css), para o vídeo ter a cara dele.
export const VERDE = '#1b7f4f'; // --accent
export const PRETO = '#000'; // --bg do tema escuro
export const BRANCO = '#f5f5f7'; // --ink do tema escuro
export const CINZA = '#a1a1a6'; // --ink-2 do tema escuro
export const CINZA_CLARO = '#d1d1d6';
export const BEZEL = '#1d1d1f'; // --bezel
export const RIM = 'rgba(255, 255, 255, .12)'; // --rim
export const HALO = 'rgba(27, 127, 79, .42)'; // o halo do --accent atrás do celular
export const FONTE = 'Inter, "Helvetica Neue", Arial, sans-serif';

// O quadro: 4:5 em 1080×1350, 30 qps, 10 s.
export const LARGURA = 1080;
export const ALTURA = 1350;
export const QPS = 30;
export const DURACAO = 300;

// O número de testes sai da ficha técnica do historico/ACOMPANHAMENTO.md
// (Tem na Geladeira: 1296 em 80 suítes, CI verde no a10376e, 08/10/2026).
// Muda na véspera do render, junto com a ficha.
export const TESTES = 1296;

// O texto da cena 3 (inglês na tela, como o roteiro).
export const TEXTO = {
  titulo: 'Tem na Geladeira',
  subtitulo: 'My recipe app, in beta on Google Play and TestFlight',
  legenda: ['You tick what you have.', 'It shows what you can cook.'],
  contador: 'automated tests in CI',
} as const;
