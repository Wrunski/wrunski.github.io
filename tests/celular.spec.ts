import { test, expect } from '@playwright/test';
import { IDIOMAS, PAGINAS_E_404 as PAGINAS } from './paginas';

// A largura do iPhone pequeno. Nada pode rolar de lado: quando rola, é um
// elemento mais largo que a tela (texto comprido sem quebra, imagem sem
// max-width, tabela), e o visitante vê a página "sobrando" para a direita.
test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

for (const pagina of PAGINAS) {
  for (const idioma of IDIOMAS) {
    test(`${pagina.nome} em ${idioma} não rola de lado a 375 px`, async ({ page }) => {
      // Idioma escolhido antes de a página pintar, como o site.js faz com a escolha salva.
      await page.addInitScript((lang) => localStorage.setItem('lang', lang), idioma);
      await page.goto(pagina.caminho);
      await expect(page.locator('html')).toHaveAttribute('data-lang', idioma);
      await page.evaluate(() => document.fonts.ready);

      const medidas = await page.evaluate(() => {
        const html = document.documentElement;
        return {
          largura: html.clientWidth,
          conteudo: Math.max(html.scrollWidth, document.body.scrollWidth),
          rolagem: window.scrollX,
        };
      });
      expect(medidas.conteudo, 'o conteúdo cabe na largura da tela').toBeLessThanOrEqual(medidas.largura);
      expect(medidas.rolagem, 'a página abre sem rolagem lateral').toBe(0);
    });
  }

  test(`${pagina.nome} mostra o menu do celular, que abre e fecha`, async ({ page }) => {
    await page.goto(pagina.caminho);
    const botao = page.locator('.nav-toggle');
    const links = page.locator('#nav-links');
    await expect(botao).toBeVisible();
    await expect(links).toBeHidden();
    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');
    await expect(links).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(links).toBeHidden();
  });
}
