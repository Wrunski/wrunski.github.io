import { test, expect } from '@playwright/test';
import { IDIOMAS } from './paginas';

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
