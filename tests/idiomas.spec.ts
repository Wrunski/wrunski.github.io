import { test, expect, type Page } from '@playwright/test';
import { HTML_LANG, IDIOMAS, PAGINAS, SOBRE_NO_MENU, type Idioma } from './paginas';

// O que "estar em um idioma" significa para o site: o atributo que o CSS
// usa para esconder os outros idiomas, o <html lang> que o leitor de tela
// usa, o título da aba, o botão marcado e um texto visível traduzido.
async function esperarIdioma(page: Page, idioma: Idioma) {
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-lang', idioma);
  await expect(html).toHaveAttribute('lang', HTML_LANG[idioma]);
  const titulo = await html.getAttribute(`data-title-${idioma}`);
  expect(titulo, `a página tem título em ${idioma}`).toBeTruthy();
  await expect(page).toHaveTitle(titulo!);
  for (const outro of IDIOMAS) {
    await expect(page.locator(`.lang button[data-set="${outro}"]`)).toHaveAttribute(
      'aria-pressed',
      String(outro === idioma),
    );
  }
  await expect(page.locator('#nav-links [data-lang]:visible', { hasText: SOBRE_NO_MENU[idioma] })).toBeVisible();
  // Nenhum texto dos outros idiomas fica à mostra no menu.
  for (const outro of IDIOMAS) {
    if (outro !== idioma) await expect(page.locator(`#nav-links [data-lang="${outro}"]:visible`)).toHaveCount(0);
  }
}

test.describe('troca de idioma', () => {
  // O navegador do teste está em en-US: sem escolha salva, o site abre em inglês.
  test('sem escolha salva, o idioma segue o navegador (en-US abre em inglês)', async ({ page }) => {
    await page.goto('/');
    await esperarIdioma(page, 'en');
    expect(await page.evaluate(() => localStorage.getItem('lang'))).toBeNull();
  });

  for (const idioma of IDIOMAS) {
    test(`o botão ${idioma.toUpperCase()} troca a página inteira para ${idioma}`, async ({ page }) => {
      await page.goto('/');
      await page.locator(`.lang button[data-set="${idioma}"]`).click();
      await esperarIdioma(page, idioma);
      expect(await page.evaluate(() => localStorage.getItem('lang')), 'a escolha fica salva na chave "lang"').toBe(idioma);
    });
  }

  test('a escolha vale entre as páginas e sobrevive a recarregar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lang button[data-set="es"]').click();
    await esperarIdioma(page, 'es');
    for (const pagina of PAGINAS) {
      await page.goto(pagina.caminho);
      await esperarIdioma(page, 'es');
    }
    await page.reload();
    await esperarIdioma(page, 'es');
    // E volta ao português, de outra página, do mesmo jeito.
    await page.locator('.lang button[data-set="pt"]').click();
    await esperarIdioma(page, 'pt');
    await page.goto('/');
    await esperarIdioma(page, 'pt');
  });

  test('o localStorage guarda só a escolha do idioma (regra S10)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lang button[data-set="en"]').click();
    await page.goto('/sobre/');
    const chaves = await page.evaluate(() => Object.keys(localStorage));
    expect(chaves).toEqual(['lang']);
  });
});

test.describe('idioma do navegador em espanhol', () => {
  test.use({ locale: 'es-ES' });
  test('sem escolha salva, abre em espanhol', async ({ page }) => {
    await page.goto('/');
    await esperarIdioma(page, 'es');
  });
});

test.describe('idioma do navegador em português', () => {
  test.use({ locale: 'pt-BR' });
  test('sem escolha salva, abre em português', async ({ page }) => {
    await page.goto('/');
    await esperarIdioma(page, 'pt');
  });
});
