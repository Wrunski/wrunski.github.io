import { test, expect, type Page } from '@playwright/test';
import { PAGINAS_E_404 as PAGINAS } from './paginas';

// O site segue o tema do sistema (prefers-color-scheme), sem botão próprio.
// O teste finge os dois sistemas e mede a cor de fundo e a do texto que o
// navegador aplicou de verdade, e não o que o CSS promete.
async function cores(page: Page) {
  return page.evaluate(() => {
    const estilo = getComputedStyle(document.body);
    return { fundo: estilo.backgroundColor, texto: estilo.color };
  });
}

for (const pagina of PAGINAS) {
  test(`${pagina.nome} aplica o tema escuro quando o sistema pede`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(pagina.caminho);
    const escuro = await cores(page);
    expect(escuro.fundo, 'o fundo fica preto').toBe('rgb(0, 0, 0)');
    expect(escuro.texto, 'o texto fica claro').toBe('rgb(245, 245, 247)');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light dark');
  });

  test(`${pagina.nome} fica no tema claro quando o sistema pede`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(pagina.caminho);
    const claro = await cores(page);
    expect(claro.fundo, 'o fundo fica branco').toBe('rgb(255, 255, 255)');
    expect(claro.texto, 'o texto fica escuro').toBe('rgb(29, 29, 31)');
  });
}
