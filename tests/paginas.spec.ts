import { test, expect } from '@playwright/test';
import { PAGINAS } from './paginas';

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
}

// Um endereço que não existe devolve 404, e não uma página qualquer: assim
// o teste dos links consegue distinguir um link quebrado de um que funciona.
test('um endereço inexistente devolve 404', async ({ request }) => {
  const resposta = await request.get('/pagina-que-nao-existe/');
  expect(resposta.status()).toBe(404);
});
