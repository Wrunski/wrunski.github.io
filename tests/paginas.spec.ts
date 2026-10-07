import { test, expect } from '@playwright/test';
import { IDIOMAS, PAGINAS } from './paginas';

// Cada página responde, tem título e mostra o conteúdo principal.
for (const pagina of PAGINAS) {
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

// Um endereço que não existe devolve 404, e não uma página qualquer: assim
// o teste dos links consegue distinguir um link quebrado de um que funciona.
test('um endereço inexistente devolve 404', async ({ request }) => {
  const resposta = await request.get('/pagina-que-nao-existe/');
  expect(resposta.status()).toBe(404);
});
