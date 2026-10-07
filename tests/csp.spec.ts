import { test, expect } from '@playwright/test';
import { PAGINAS } from './paginas';

// A Content-Security-Policy (decisão S10) é a lista do que a página pode
// carregar e rodar. Num site estático no GitHub Pages ela vai em <meta>,
// porque não dá para mandar cabeçalho. O teste confere que ela está em
// cada página, que é restritiva e que não barra nada que a página usa.
for (const pagina of PAGINAS) {
  test(`${pagina.nome} tem a CSP em <meta>, restritiva e sem violação`, async ({ page }) => {
    const violacoes: string[] = [];
    page.on('console', (msg) => {
      if (/Content[- ]Security[- ]Policy/i.test(msg.text())) violacoes.push(msg.text());
    });

    await page.goto(pagina.caminho);
    const meta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(meta).toHaveCount(1);
    const csp = (await meta.getAttribute('content')) || '';
    const diretivas = new Map(
      csp
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const [nome, ...valores] = d.split(/\s+/);
          return [nome, valores] as const;
        }),
    );

    expect(diretivas.get('default-src'), 'por padrão, só o próprio site').toEqual(["'self'"]);
    expect(diretivas.get('script-src'), 'script só do próprio site').toEqual(["'self'"]);
    expect(diretivas.get('object-src'), 'nenhum plugin').toEqual(["'none'"]);
    expect(diretivas.get('base-uri'), 'ninguém troca a base dos links').toEqual(["'self'"]);
    expect(diretivas.get('form-action'), 'nenhum formulário manda dado para fora').toEqual(["'self'"]);
    expect(csp, 'nenhum script embutido ou eval liberado').not.toMatch(/'unsafe-inline'|'unsafe-eval'/);

    // Fora o próprio site, só as fontes do Google (a única coisa de fora, S10).
    const externos = [...diretivas.values()].flat().filter((v) => /^https?:/.test(v));
    expect(new Set(externos)).toEqual(new Set(['https://fonts.googleapis.com', 'https://fonts.gstatic.com']));

    // A página inteira carregou e rodou (o site.js marcou o idioma) sem
    // nenhuma queixa do navegador sobre a CSP.
    await expect(page.locator('html')).toHaveAttribute('data-lang', /^(pt|en|es)$/);
    await expect(page.locator('html')).toHaveClass(/\bjs\b/);
    expect(violacoes, 'nenhuma violação da CSP no console').toEqual([]);
  });
}
