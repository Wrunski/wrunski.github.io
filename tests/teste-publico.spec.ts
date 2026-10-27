import { test, expect, type Page } from '@playwright/test';
import { IDIOMAS, type Idioma } from './paginas';

// O teste fechado do Organizador na Google Play ficou aberto a quem entra
// no Grupo do Google (a faixa "Teste público", aprovada em 21/10/2026). Na
// /testes/, o cartão Android do Organizador traz os dois passos, como o do
// Tem na Geladeira: entrar no grupo e abrir o teste com o mesmo Gmail.
const GRUPO = 'https://groups.google.com/g/testadores-organizadorfinancas';
const TESTE_NA_PLAY = 'https://play.google.com/apps/testing/com.wrunski.organizadorfinancas';

// A frase de quando o Android do Organizador era só por convite, nos três
// idiomas. Ela não pode voltar à /testes/ nem à página do app.
const POR_CONVITE = ['por convite', 'by invitation', 'por invitación'];
const PAGINAS_DO_CONVITE = ['/testes/', '/apps/organizador-financas/'];

test.describe('o teste público do Organizador no Android', () => {
  for (const idioma of IDIOMAS) {
    test(`na /testes/, em ${idioma}, o cartão Android do Organizador tem o grupo e o teste na Google Play`, async ({ page }) => {
      await page.goto('/testes/');
      await page.locator(`.lang button[data-set="${idioma}"]`).click();

      const secao = page
        .locator(`main > [data-lang="${idioma}"] section`)
        .filter({ has: page.locator('h2', { hasText: 'Organizador de Finanças' }) });
      const android = secao.locator('.plat').filter({ has: page.locator('h3', { hasText: /^Android$/ }) });
      await expect(android).toHaveCount(1);
      await expect(android).toBeVisible();
      await expect(android, 'o cartão deixou de ser o do "em breve"').not.toHaveClass(/\bsoon\b/);

      // Os dois passos, na ordem: primeiro o grupo, depois o teste.
      const passos = android.locator('ol.how > li');
      await expect(passos).toHaveCount(2);
      const grupo = passos.nth(0).locator('a.pill');
      const teste = passos.nth(1).locator('a.pill');
      await expect(grupo).toBeVisible();
      await expect(grupo).toHaveAttribute('href', GRUPO);
      await expect(teste).toBeVisible();
      await expect(teste).toHaveAttribute('href', TESTE_NA_PLAY);

      // O pedido dos 14 dias, como no cartão do Tem na Geladeira.
      await expect(android.locator('p.fine')).toContainText('14');
    });
  }

  for (const caminho of PAGINAS_DO_CONVITE) {
    test(`em ${caminho}, o "por convite" sumiu dos três idiomas`, async ({ page }) => {
      await page.goto(caminho);
      // O documento inteiro: o texto dos três idiomas (os outros dois só
      // ficam escondidos pelo CSS) e os atributos, como a descrição.
      const html = (await page.content()).toLowerCase();
      for (const frase of POR_CONVITE) {
        expect(html, `"${frase}" em ${caminho}`).not.toContain(frase);
      }
    });
  }
});

// As decisões do Wagner de 25/10/2026 sobre a /testes/ (a conferência de
// 21/10 do material do Organizador 2.1, no planos/INVENTARIO-MATERIAL.md).

// (h) O formulário anônimo de feedback do teste do Organizador (o
// links-apps/README.md), em "Achou algo estranho?".
const FORMULARIO = 'https://forms.gle/coR5zWsii7jYHFQV8';
const ACHOU_ALGO: Record<Idioma, string> = {
  pt: 'Achou algo estranho',
  en: 'Found something odd',
  es: 'Encontraste algo raro',
};

// (k) O link público do TestFlight leva ao grupo externo, que só recebe a
// versão depois de a Apple aprová-la: o cartão do iPhone do Organizador diz isso.
const TESTFLIGHT_DO_ORGANIZADOR = 'https://testflight.apple.com/join/dbTb9gV7';
const IPHONE_DEPOIS_DA_APPLE: Record<Idioma, string> = {
  pt: 'O teste no iPhone começa quando a Apple aprovar a versão.',
  en: 'Testing on iPhone starts once Apple approves the version.',
  es: 'La prueba en iPhone empieza cuando Apple apruebe la versión.',
};

async function abrirTestes(page: Page, idioma: Idioma) {
  await page.goto('/testes/');
  await page.locator(`.lang button[data-set="${idioma}"]`).click();
}

// A seção de um idioma cujo título (h2) tem o texto dado.
function secao(page: Page, idioma: Idioma, titulo: string) {
  return page.locator(`main > [data-lang="${idioma}"] section`).filter({ has: page.locator('h2', { hasText: titulo }) });
}

test.describe('a /testes/ depois das decisões de 25/10', () => {
  for (const idioma of IDIOMAS) {
    // (g) O Android primeiro, nos dois apps: o Organizador segue o Tem na Geladeira.
    test(`em ${idioma}, o cartão do Android vem antes do iPhone nos dois apps`, async ({ page }) => {
      await abrirTestes(page, idioma);
      for (const app of ['Tem na Geladeira', 'Organizador de Finanças']) {
        const bloco = secao(page, idioma, app);
        await expect(bloco, `a seção do ${app}`).toHaveCount(1);
        await expect(bloco.locator('.plat > h3'), `a ordem dos cartões do ${app}`).toHaveText(['Android', 'iPhone']);
      }
    });

    test(`em ${idioma}, o cartão do iPhone do Organizador diz que o teste começa quando a Apple aprovar a versão`, async ({ page }) => {
      await abrirTestes(page, idioma);
      const iphone = secao(page, idioma, 'Organizador de Finanças')
        .locator('.plat')
        .filter({ has: page.locator('h3', { hasText: /^iPhone$/ }) });
      await expect(iphone).toHaveCount(1);
      await expect(iphone.locator('a.pill'), 'o convite segue no cartão').toHaveAttribute('href', TESTFLIGHT_DO_ORGANIZADOR);
      await expect(iphone.locator('p.fine')).toBeVisible();
      await expect(iphone.locator('p.fine')).toHaveText(IPHONE_DEPOIS_DA_APPLE[idioma]);
    });

    test(`em ${idioma}, "Achou algo estranho?" leva ao formulário anônimo do teste do Organizador`, async ({ page }) => {
      await abrirTestes(page, idioma);
      const bloco = secao(page, idioma, ACHOU_ALGO[idioma]);
      await expect(bloco).toHaveCount(1);
      const link = bloco.locator(`a[href="${FORMULARIO}"]`);
      await expect(link).toHaveCount(1);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /\bnoopener\b/);
      // O formulário é só do Organizador, e o texto diz de qual app ele é.
      await expect(bloco.locator('p.lead')).toContainText('Organizador de Finanças');
    });
  }
});
