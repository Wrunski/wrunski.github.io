import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGINAS } from './paginas';

// O axe-core, o mesmo motor do Lighthouse e da extensão axe DevTools, roda
// as regras das WCAG 2.2 nos níveis A e AA em cada página, no tema claro.
// O que ele marca como "sério" ou "crítico" (contraste insuficiente, imagem
// sem alternativa, botão sem nome, controle fora do teclado) reprova o
// teste; o "menor" e o "moderado" ficam no relatório, para a revisão.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const REPROVAM = new Set(['serious', 'critical']);

for (const pagina of PAGINAS) {
  test(`${pagina.nome} não tem violação séria ou crítica de acessibilidade`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(pagina.caminho);
    await page.evaluate(() => document.fonts.ready);

    const resultado = await new AxeBuilder({ page }).withTags(TAGS).analyze();

    await info.attach(`axe-${pagina.caminho.replace(/\W+/g, '-')}.json`, {
      body: JSON.stringify(resultado.violations, null, 2),
      contentType: 'application/json',
    });

    const serias = resultado.violations
      .filter((v) => REPROVAM.has(v.impact || ''))
      .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join('; ')}`);
    expect(serias, 'nenhuma violação séria ou crítica').toEqual([]);
  });
}
