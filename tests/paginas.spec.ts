import { test, expect } from '@playwright/test';
import { IDIOMAS, PAGINA_404, PAGINAS, PAGINAS_E_404 } from './paginas';

// Cada página (a do 404 também) responde, tem título e mostra o conteúdo principal.
for (const pagina of PAGINAS_E_404) {
  test(`a página ${pagina.nome} (${pagina.caminho}) responde`, async ({ page }) => {
    const resposta = await page.goto(pagina.caminho);
    expect(resposta, 'o servidor devolveu uma resposta').not.toBeNull();
    expect(resposta!.status(), 'o status é 200').toBe(200);
    await expect(page).toHaveTitle(/Wagner Wrunski/);
    await expect(page.locator('main#main')).toBeVisible();
    await expect(page.locator('main h1:visible')).toHaveCount(1);
  });

  // A descrição da página (a meta description, que o navegador e os
  // buscadores leem) existe nos três idiomas, uma diferente da outra, e a
  // que está escrita no HTML (a que um robô sem JavaScript lê) é uma delas.
  test(`a página ${pagina.nome} tem a descrição nos três idiomas`, async ({ page }) => {
    await page.goto(pagina.caminho);
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveCount(1);
    const descricoes = new Map<string, string>();
    for (const idioma of IDIOMAS) {
      const texto = (await meta.getAttribute(`data-desc-${idioma}`)) || '';
      expect(texto.trim().length, `a descrição em ${idioma} não está vazia`).toBeGreaterThan(40);
      expect(texto.length, `a descrição em ${idioma} cabe no resultado da busca`).toBeLessThanOrEqual(220);
      descricoes.set(idioma, texto);
    }
    expect(new Set(descricoes.values()).size, 'as três descrições são diferentes').toBe(3);
    expect([...descricoes.values()], 'a descrição escrita no HTML é uma das três').toContain(await meta.getAttribute('content'));
  });

  // O ícone do site (a marca do sinal verde): o SVG para os navegadores
  // modernos, o PNG de 32 px para os outros e o ícone de 180 px que o
  // iPhone usa na tela de início. Os três existem e são o tipo que dizem.
  test(`a página ${pagina.nome} declara o ícone do site, e ele existe`, async ({ page, request }) => {
    await page.goto(pagina.caminho);
    const icones = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll((ls) =>
      ls.map((l) => ({ rel: l.getAttribute('rel'), type: l.getAttribute('type'), href: (l as HTMLLinkElement).href })),
    );
    expect(icones.map((i) => `${i.rel} ${new URL(i.href).pathname}`).sort()).toEqual([
      'apple-touch-icon /img/apple-touch-icon.png',
      'icon /img/favicon-32.png',
      'icon /img/favicon.svg',
    ]);
    for (const icone of icones) {
      const resposta = await request.get(icone.href);
      expect(resposta.status(), `${icone.href} existe`).toBe(200);
      const esperado = icone.href.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      expect(resposta.headers()['content-type'], `${icone.href} é ${esperado}`).toContain(esperado);
    }
  });
}

// A página do 404 é servida pelo GitHub Pages em qualquer endereço que não
// existe, em qualquer profundidade: tudo o que ela carrega e todo link
// interno precisam ser absolutos (a partir da raiz), senão quebram em
// /apps/x/y/. E ela não entra nos buscadores.
test('a página 404 usa só caminhos absolutos e é noindex', async ({ page }) => {
  await page.goto(PAGINA_404.caminho);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  const relativos = await page.evaluate(() => {
    const atributos: [string, string][] = [['link[href]', 'href'], ['script[src]', 'src'], ['img[src]', 'src'], ['a[href]', 'href']];
    const errados: string[] = [];
    for (const [seletor, atributo] of atributos) {
      document.querySelectorAll(seletor).forEach((el) => {
        const valor = el.getAttribute(atributo) || '';
        if (/^(https?:|mailto:|#)/.test(valor)) return;
        if (!valor.startsWith('/')) errados.push(`${seletor} ${atributo}="${valor}"`);
      });
    }
    return errados;
  });
  expect(relativos, 'nenhum caminho relativo').toEqual([]);
  // Ela leva de volta ao início, visivelmente.
  await expect(page.locator('main a.pill:visible')).toHaveAttribute('href', '/');
});

for (const pagina of PAGINAS) {
  // O cartão de prévia (WhatsApp, LinkedIn, X): título, descrição, imagem
  // de 1200×630 que existe no site e o texto alternativo da imagem, no
  // Open Graph e no Twitter. Sem o alt, o leitor de tela de quem recebe o
  // link não sabe o que há na imagem.
  test(`a página ${pagina.nome} tem o cartão de prévia completo`, async ({ page, request }) => {
    await page.goto(pagina.caminho);
    const meta = async (seletor: string) => {
      const el = page.locator(seletor);
      await expect(el, `${seletor} existe uma vez`).toHaveCount(1);
      const valor = (await el.getAttribute('content')) || '';
      expect(valor.trim().length, `${seletor} não está vazio`).toBeGreaterThan(0);
      return valor;
    };
    const titulo = await meta('meta[property="og:title"]');
    expect(titulo).toBe(await meta('meta[name="twitter:title"]'));
    await meta('meta[property="og:description"]');
    await meta('meta[name="twitter:description"]');
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(await meta('meta[property="og:image:width"]')).toBe('1200');
    expect(await meta('meta[property="og:image:height"]')).toBe('630');

    const imagem = await meta('meta[property="og:image"]');
    expect(imagem).toBe(await meta('meta[name="twitter:image"]'));
    expect(imagem, 'a imagem do cartão é um endereço absoluto do site, em HTTPS').toMatch(/^https:\/\/wrunski\.github\.io\/img\//);
    const resposta = await request.get(new URL(imagem).pathname);
    expect(resposta.status(), 'a imagem do cartão existe no site').toBe(200);
    expect(resposta.headers()['content-type'], 'é um PNG').toContain('image/png');

    const alt = await meta('meta[property="og:image:alt"]');
    expect(alt.length, 'o alt descreve o cartão').toBeGreaterThan(40);
    expect(await meta('meta[name="twitter:image:alt"]'), 'o alt do Twitter é o mesmo').toBe(alt);

    const url = await meta('meta[property="og:url"]');
    expect(url).toBe(`https://wrunski.github.io${pagina.caminho}`);
    await expect(page.locator('link[rel="canonical"]'), 'o canonical é a mesma URL').toHaveAttribute('href', url);
  });
}

// O sitemap lista exatamente as cinco páginas, pelos endereços canônicos, e
// o robots.txt libera o site inteiro e aponta para o sitemap.
test('o sitemap tem as cinco páginas, e o robots.txt aponta para ele', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  expect(locs).toEqual(PAGINAS.map((p) => `https://wrunski.github.io${p.caminho}`).sort());

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const texto = await robots.text();
  expect(texto).toMatch(/^User-agent: \*$/m);
  expect(texto).toMatch(/^Allow: \/$/m);
  expect(texto).toMatch(/^Sitemap: https:\/\/wrunski\.github\.io\/sitemap\.xml$/m);
  expect(texto, 'nada é bloqueado').not.toMatch(/^Disallow: \S/m);
});

// Um endereço que não existe devolve 404, e não uma página qualquer: assim
// o teste dos links consegue distinguir um link quebrado de um que funciona.
test('um endereço inexistente devolve 404', async ({ request }) => {
  const resposta = await request.get('/pagina-que-nao-existe/');
  expect(resposta.status()).toBe(404);
});
