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

// O mestre: 9:16 em 1080×1920, 30 qps, 24 s. Os cortes de cada lugar (as
// lojas, os Reels, o LinkedIn em 4:5, o site) saem dele na parte 2; por isso
// o que importa fica na faixa central de 4:5 (de y = 285 a 1635), que o
// conferir.sh recorta para conferir.
export const LARGURA = 1080;
export const ALTURA = 1920;
export const QPS = 30;
export const DURACAO = 720;
export const FAIXA_4X5_TOPO = (ALTURA - 1350) / 2; // 285

// O texto que aparece no vídeo, em português (decisão do Wagner em 10/10/2026:
// o vídeo vende e apresenta o app para quem vai usar; nada de testes). O
// subtítulo é o da App Store (planos/PLANO-TEM-NA-GELADEIRA-1.0.md, "Textos
// das lojas"). Sem emoji, sem nome de testador, sem selo de loja: só o texto
// "Google Play" e "TestFlight".
export const TEXTO = {
  titulo: 'Tem na Geladeira',
  subtitulo: 'Receitas com o que você tem',
  cena1: 'Marque o que você tem em casa.',
  cena2: 'Veja o que dá para fazer agora.',
  cena3: 'Abra a receita e ajuste as porções.',
  chamada: 'Baixe o beta',
  lojas: 'Google Play e TestFlight',
} as const;
