// As cinco páginas do site (decisão S1 do PLANO-SITE.md) e os idiomas
// (padroes/IDIOMAS.md). Tudo que os testes percorrem sai daqui, para uma
// página nova entrar num lugar só.

export type Idioma = 'pt' | 'en' | 'es';

export const IDIOMAS: Idioma[] = ['pt', 'en', 'es'];

// O valor que o site.js põe em <html lang> para cada idioma.
export const HTML_LANG: Record<Idioma, string> = { pt: 'pt-BR', en: 'en', es: 'es' };

export const PAGINAS = [
  { caminho: '/', nome: 'Início' },
  { caminho: '/sobre/', nome: 'Sobre' },
  { caminho: '/apps/organizador-financas/', nome: 'Organizador de Finanças' },
  { caminho: '/apps/tem-na-geladeira/', nome: 'Tem na Geladeira' },
  { caminho: '/testes/', nome: 'Teste os apps' },
] as const;

// A página que o GitHub Pages mostra num endereço que não existe. Não tem
// cartão de prévia (é noindex) e, por isso, fica fora de PAGINAS; os
// testes que valem para ela a incluem pelo PAGINAS_E_404.
export const PAGINA_404 = { caminho: '/404.html', nome: 'Página não encontrada' } as const;
export const PAGINAS_E_404 = [...PAGINAS, PAGINA_404] as const;

// O texto do link "Sobre" no menu, em cada idioma: é por ele que os testes
// veem que a página inteira trocou de idioma, e não só um atributo.
export const SOBRE_NO_MENU: Record<Idioma, string> = { pt: 'Sobre', en: 'About', es: 'Sobre mí' };
