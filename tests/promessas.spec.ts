import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { IDIOMAS, type Idioma } from './paginas';

// O que o site promete sobre os apps tem de valer para a versão que chega a
// quem lê. As decisões do Wagner de 25/10/2026, da conferência de 21/10 do
// material do Organizador 2.1 (o planos/INVENTARIO-MATERIAL.md).

// O código-fonte da página, como o servidor a entrega: o texto dos três
// idiomas (os outros dois só ficam escondidos pelo CSS) e os atributos,
// como a descrição, o cartão de prévia e o alt das imagens.
async function fonte(request: APIRequestContext, caminho: string) {
  const resposta = await request.get(caminho);
  expect(resposta.status(), `${caminho} responde`).toBe(200);
  return resposta.text();
}

async function abrir(page: Page, caminho: string, idioma: Idioma) {
  await page.goto(caminho);
  await page.locator(`.lang button[data-set="${idioma}"]`).click();
}

// Um trecho de texto como expressão regular, sem diferença de maiúsculas.
function trecho(texto: string) {
  return new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// (b) As três frases de antes sobre o Organizador, nos três idiomas, não
// valem: o conversor e a compra do Pro usam a internet, e o backup do
// sistema guarda uma cópia na conta de quem usa. A frase que vale é a da
// privacidade da página do app, "Seus lançamentos nunca chegam até nós".
const FRASES_DE_ANTES = [
  'nenhum lançamento sai do seu celular',
  'nothing you enter leaves your phone',
  'nada de lo que registras sale de tu móvil',
  'tudo fica no seu celular',
  'everything stays on your phone',
  'todo se queda en tu móvil',
  'os lançamentos ficam no seu celular',
  'your entries stay on your phone',
  'tus registros se quedan en tu móvil',
];
const NUNCA_CHEGAM: Record<Idioma, string> = {
  pt: 'seus lançamentos nunca chegam até nós',
  en: 'your entries never reach us',
  es: 'tus registros nunca llegan a nosotros',
};
const PAGINAS_DO_ORGANIZADOR = ['/', '/apps/organizador-financas/', '/testes/'];

// (c) A /testes/ não diz que os apps são de graça: o Organizador 2.1 tem a
// compra do Pro. Fica o "sem anúncios e sem conta", que vale para os dois.
// O "free" que vale é a palavra solta, e não a de "gluten-free".
const DE_GRACA = [/de graça/i, /grátis/i, /\bgratis\b/i, /gratuit/i, /(?<![\w-])free(?![\w-])/i];
const SEM_ANUNCIOS: Record<Idioma, string> = {
  pt: 'sem anúncios e sem conta',
  en: 'no ads and no account',
  es: 'sin anuncios y sin cuenta',
};
const LINHA_DO_PRO: Record<Idioma, string> = {
  pt: 'Tem uma compra única opcional, o Pro; quem já usa o app com lançamentos fica com tudo liberado.',
  en: 'There’s an optional one-time purchase, Pro; if you already use the app with entries, you keep everything unlocked.',
  es: 'Tiene una compra única opcional, Pro; si ya usas la app con registros, sigues con todo desbloqueado.',
};

// (d) A captura escura é da 1.7.0 e sai até as capturas da 2.1: quando a
// escura da 2.1 entrar, este teste muda junto.
const IMAGEM_ESCURA_DA_1_7 = 'organizador-escuro';

test.describe('as frases sobre o Organizador', () => {
  for (const caminho of PAGINAS_DO_ORGANIZADOR) {
    test(`em ${caminho}, as três frases de antes sumiram dos três idiomas`, async ({ request }) => {
      const html = (await fonte(request, caminho)).toLowerCase();
      for (const frase of FRASES_DE_ANTES) {
        expect(html, `"${frase}" em ${caminho}`).not.toContain(frase);
      }
    });
  }

  for (const idioma of IDIOMAS) {
    test(`no Início, em ${idioma}, o Organizador diz que os lançamentos nunca chegam até nós`, async ({ page }) => {
      await abrir(page, '/', idioma);
      await expect(page.locator('#organizador p.title:visible')).toContainText(NUNCA_CHEGAM[idioma], { ignoreCase: true });
    });

    test(`na página do app, em ${idioma}, as funções e a descrição dizem que os lançamentos nunca chegam até nós`, async ({ page }) => {
      await abrir(page, '/apps/organizador-financas/', idioma);
      await expect(page.locator('#funcoes p.lead:visible')).toContainText(NUNCA_CHEGAM[idioma], { ignoreCase: true });
      await expect(page.locator('meta[name="description"]'), 'a descrição da página').toHaveAttribute('content', trecho(NUNCA_CHEGAM[idioma]));
    });
  }

  test('na página do app, o cartão de prévia diz que os lançamentos nunca chegam até nós', async ({ page }) => {
    await page.goto('/apps/organizador-financas/');
    for (const seletor of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) {
      await expect(page.locator(seletor), seletor).toHaveAttribute('content', trecho(NUNCA_CHEGAM.pt));
    }
  });
});

test.describe('a /testes/ sem o "de graça"', () => {
  test('nenhum idioma diz que os apps são de graça, nem no texto, nem na descrição, nem no cartão de prévia', async ({ request }) => {
    const html = await fonte(request, '/testes/');
    for (const padrao of DE_GRACA) {
      expect(html, `${padrao} na /testes/`).not.toMatch(padrao);
    }
  });

  for (const idioma of IDIOMAS) {
    test(`em ${idioma}, fica o "sem anúncios e sem conta", e o Organizador conta da compra do Pro`, async ({ page }) => {
      await abrir(page, '/testes/', idioma);
      await expect(page.locator(`main > [data-lang="${idioma}"] .hero .sub`)).toContainText(SEM_ANUNCIOS[idioma]);
      const organizador = page
        .locator(`main > [data-lang="${idioma}"] section`)
        .filter({ has: page.locator('h2', { hasText: 'Organizador de Finanças' }) });
      await expect(organizador.locator('p.lead')).toBeVisible();
      await expect(organizador.locator('p.lead')).toContainText(LINHA_DO_PRO[idioma]);
    });
  }
});

test.describe('a imagem escura da 1.7.0', () => {
  for (const caminho of ['/', '/apps/organizador-financas/']) {
    test(`em ${caminho}, a captura escura da 1.7.0 saiu`, async ({ page, request }) => {
      expect(await fonte(request, caminho), `${IMAGEM_ESCURA_DA_1_7} em ${caminho}`).not.toContain(IMAGEM_ESCURA_DA_1_7);
      // O Organizador segue com a captura de lançamentos (a outra figura do
      // mesmo palco); que ela carrega, o links.spec.ts confere.
      await page.goto(caminho);
      await expect(page.locator('img[src*="organizador-lancamentos"]')).toHaveCount(1);
    });
  }
});
