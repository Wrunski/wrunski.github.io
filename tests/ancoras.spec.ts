import { test, expect } from '@playwright/test';

// Os endereços do site antigo, que já foram enviados por aí (currículo,
// LinkedIn, WhatsApp), continuam valendo (decisão S9 do plano): cada
// âncora existe uma vez só e leva à parte dos apps.
const ANCORAS = ['trabalho', 'work', 'trabajo'];

// O CSS reserva 64 px no topo (scroll-padding-top) para a barra fixa não
// cobrir o destino. O teste aceita a âncora em qualquer ponto dessa faixa.
const FAIXA_DO_TOPO = 80;

for (const ancora of ANCORAS) {
  test(`a âncora #${ancora} existe na página inicial e rola até os apps`, async ({ page }) => {
    // Sem rolagem suave, para medir a posição final, e não o meio da animação.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/#${ancora}`);
    const alvo = page.locator(`#${ancora}`);
    await expect(alvo, 'o id existe uma vez só').toHaveCount(1);
    expect(await page.evaluate(() => location.hash)).toBe(`#${ancora}`);

    // O navegador rolou até a âncora: ela ficou no topo da tela, e o topo da
    // página (a apresentação) ficou para trás.
    await page.waitForFunction(
      ([id, faixa]) => {
        const r = document.getElementById(id as string)!.getBoundingClientRect();
        return window.scrollY > 0 && r.top >= -1 && r.top <= (faixa as number);
      },
      [ancora, FAIXA_DO_TOPO] as const,
    );
    expect(await page.evaluate(() => window.scrollY), 'a página rolou').toBeGreaterThan(0);
  });
}

test('as três âncoras ficam juntas, logo antes da seção do Organizador', async ({ page }) => {
  await page.goto('/');
  const topos = await page.evaluate(() =>
    ['trabalho', 'work', 'trabajo'].map((id) => Math.round(document.getElementById(id)!.getBoundingClientRect().top)),
  );
  expect(new Set(topos).size, 'as três estão na mesma altura').toBe(1);
  // O que vem logo depois das âncoras é a seção do Organizador de Finanças.
  const seguinte = page.locator('#trabajo + *');
  await expect(seguinte).toHaveAttribute('id', 'organizador');
  await expect(seguinte.locator('.app-name')).toContainText('Organizador de Finanças');
});
