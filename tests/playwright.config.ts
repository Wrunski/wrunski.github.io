import { defineConfig, devices } from '@playwright/test';

// Os testes servem a pasta do site (a raiz do repositório, um nível acima)
// com o servidor estático do Python, sem build e sem internet, fora o que
// a própria página carrega (as fontes do Google). Só o Chromium: é o que o
// CI instala, e o Mac de 8 GB não roda os testes localmente por padrão.
const PORTA = 8080;
const BASE = `http://127.0.0.1:${PORTA}`;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `python3 -m http.server ${PORTA} --bind 127.0.0.1 --directory ..`,
    url: `${BASE}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
