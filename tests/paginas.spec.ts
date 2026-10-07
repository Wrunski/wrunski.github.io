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
}

// Um endereço que não existe devolve 404, e não uma página qualquer: assim
// o teste dos links consegue distinguir um link quebrado de um que funciona.
test('um endereço inexistente devolve 404', async ({ request }) => {
  const resposta = await request.get('/pagina-que-nao-existe/');
  expect(resposta.status()).toBe(404);
});
