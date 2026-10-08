import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { PAGINAS_E_404 as PAGINAS } from './paginas';

// O site publicado. Um link absoluto para ele é interno, e o teste o
// confere no servidor local, no mesmo caminho.
const SITE = 'https://wrunski.github.io';

// As políticas moram em outro repositório (decisão S3 do plano) e não
// estão na pasta do site: o teste confere só o formato desses links.
const FORA_DESTE_REPOSITORIO = [`${SITE}/politicas/`];

type Link = { href: string; texto: string; target: string | null; rel: string | null };

async function linksDaPagina(page: Page): Promise<Link[]> {
  return page.locator('a[href]').evaluateAll((as) =>
    as.map((a) => ({
      href: (a as HTMLAnchorElement).href,
      texto: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    })),
  );
}

// Um link é interno quando aponta para o servidor local ou para o próprio
// site publicado. Devolve a URL local equivalente, ou null se for externo.
function urlLocal(href: string, baseURL: string): URL | null {
  const url = new URL(href);
  const base = new URL(baseURL);
  if (url.origin === base.origin) return url;
  if (url.href.startsWith(SITE + '/')) {
    if (FORA_DESTE_REPOSITORIO.some((prefixo) => url.href.startsWith(prefixo))) return null;
    return new URL(url.pathname + url.search + url.hash, base);
  }
  return null;
}

async function idsDaPagina(request: APIRequestContext, cache: Map<string, Set<string>>, url: URL) {
  const chave = url.pathname;
  if (!cache.has(chave)) {
    const resposta = await request.get(chave);
    expect(resposta.status(), `${chave} responde`).toBe(200);
    const html = await resposta.text();
    const ids = new Set<string>();
    for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
    cache.set(chave, ids);
  }
  return cache.get(chave)!;
}

for (const pagina of PAGINAS) {
  test.describe(`links de ${pagina.nome} (${pagina.caminho})`, () => {
    test('os links internos levam a uma página que existe', async ({ page, request, baseURL }) => {
      await page.goto(pagina.caminho);
      const links = await linksDaPagina(page);
      expect(links.length, 'a página tem links').toBeGreaterThan(0);

      const ids = new Map<string, Set<string>>();
      const quebrados: string[] = [];
      const vistos = new Set<string>();
      for (const link of links) {
        const url = urlLocal(link.href, baseURL!);
        if (!url) continue;
        const chave = url.pathname + url.hash;
        if (vistos.has(chave)) continue;
        vistos.add(chave);

        const resposta = await request.get(url.pathname);
        if (resposta.status() !== 200) {
          quebrados.push(`${chave} → ${resposta.status()} ("${link.texto}")`);
          continue;
        }
        // Âncora: o destino precisa existir na página de destino.
        if (url.hash.length > 1) {
          const id = decodeURIComponent(url.hash.slice(1));
          const existentes = await idsDaPagina(request, ids, url);
          if (!existentes.has(id)) quebrados.push(`${chave} → sem id="${id}" ("${link.texto}")`);
        }
      }
      expect(quebrados, 'nenhum link interno quebrado').toEqual([]);
    });

    test('os links externos usam HTTPS e abrem em nova aba com rel="noopener"', async ({ page, baseURL }) => {
      await page.goto(pagina.caminho);
      const links = await linksDaPagina(page);
      const problemas: string[] = [];
      for (const link of links) {
        const url = new URL(link.href);
        if (url.protocol === 'mailto:') continue;
        if (urlLocal(link.href, baseURL!)) continue;
        if (url.protocol !== 'https:') problemas.push(`${link.href}: não é HTTPS`);
        if (link.target === '_blank' && !(link.rel || '').split(/\s+/).includes('noopener')) {
          problemas.push(`${link.href}: abre em nova aba sem rel="noopener"`);
        }
      }
      expect(problemas, 'nenhum link externo fora da regra S10').toEqual([]);
    });

    test('as imagens, o CSS, o JS e os ícones da página carregam', async ({ page, request }) => {
      await page.goto(pagina.caminho);
      const recursos = await page.evaluate(() => {
        const urls = new Set<string>();
        document.querySelectorAll<HTMLImageElement>('img[src]').forEach((i) => urls.add(i.src));
        document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((s) => urls.add(s.src));
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href], link[rel~="icon"][href], link[rel="apple-touch-icon"][href]').forEach((l) => urls.add(l.href));
        document.querySelectorAll<HTMLVideoElement>('video[poster]').forEach((v) => urls.add(v.poster));
        document.querySelectorAll<HTMLSourceElement>('video source[src]').forEach((s) => urls.add(s.src));
        return [...urls].filter((u) => u.startsWith(location.origin));
      });
      expect(recursos.length, 'a página referencia recursos locais').toBeGreaterThan(0);
      const faltando: string[] = [];
      for (const url of recursos) {
        const resposta = await request.get(url);
        if (resposta.status() !== 200) faltando.push(`${new URL(url).pathname} → ${resposta.status()}`);
      }
      expect(faltando, 'todo recurso local responde').toEqual([]);
    });
  });
}
