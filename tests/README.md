# Testes do site

*Última atualização: 07/10/2026*

Testes de ponta a ponta do site wrunski.github.io, escritos com o
[Playwright](https://playwright.dev) e rodados pelo GitHub Actions a cada
`push` e a cada pull request (`.github/workflows/site.yml`). Eles sobem o
site numa porta local, com o servidor estático do Python, e abrem cada
página num Chromium de verdade, como um visitante faria. Nada depende da
internet, fora as fontes do Google que a própria página carrega.

## O que cada teste prova

| Arquivo | O que prova, em uma frase |
|---|---|
| `paginas.spec.ts` | As cinco páginas (`/`, `/sobre/`, as duas dos apps e `/testes/`) respondem com 200, têm título e mostram um único título principal. Um endereço inventado devolve 404, para o teste dos links saber a diferença entre um link que funciona e um quebrado |
| `links.spec.ts` | Nenhum link interno leva a uma página que não existe, e toda âncora (`#alguma-coisa`) tem destino na página. Os links externos são HTTPS e, quando abrem em nova aba, levam `rel="noopener"` (a página de fora não ganha acesso à nossa). As imagens, o CSS e o JS de cada página carregam |
| `idiomas.spec.ts` | Os botões PT, EN e ES trocam a página inteira: o texto visível, o `<html lang>` que o leitor de tela usa, o título da aba e o botão marcado. A escolha fica salva na chave `lang` do `localStorage`, vale nas cinco páginas e sobrevive a recarregar. Sem escolha salva, o site segue o idioma do navegador. O `localStorage` guarda só essa chave |
| `celular.spec.ts` | Numa tela de 375 px (o iPhone pequeno), nenhuma página rola de lado, em nenhum dos três idiomas. O menu do celular aparece, abre e fecha pelo teclado (Esc) |
| `tema.spec.ts` | Quando o sistema está no modo escuro, o fundo fica preto e o texto claro; no claro, o contrário. O teste mede a cor que o navegador aplicou, e não o que o CSS promete |
| `ancoras.spec.ts` | As âncoras `#trabalho`, `#work` e `#trabajo` do site antigo, que já foram enviadas em currículo e mensagens, existem uma vez só, rolam a página até os apps e ficam logo antes da seção do Organizador |
| `csp.spec.ts` | Cada página traz a Content-Security-Policy em `<meta>`: por padrão só o próprio site, script só do próprio site, sem `unsafe-inline` nem `eval`, e de fora só as fontes do Google. E a página carrega inteira sem o navegador reclamar de nenhuma violação |
| `acessibilidade.spec.ts` | O [axe-core](https://github.com/dequelabs/axe-core), o mesmo motor do Lighthouse, roda as regras das WCAG 2.2 (níveis A e AA) em cada página. Qualquer violação séria ou crítica (contraste insuficiente, imagem sem alternativa, botão sem nome, controle fora do teclado) reprova. As menores ficam anexadas ao relatório, para revisão |

A lista das páginas e dos idiomas fica em `paginas.ts`: uma página nova
entra ali e passa por todos os testes.

## Como falar disso numa entrevista

- **Por que um servidor local, e não o site no ar?** Para o teste provar
  o código do commit, e não o que já foi publicado, e para rodar sem
  depender da rede. É o mesmo motivo de os testes rodarem em todo pull
  request: o defeito aparece antes de ir ao ar.
- **Por que medir, e não só olhar o HTML?** O teste do tema mede a cor
  que o navegador aplicou; o do celular mede a largura real do conteúdo;
  o dos idiomas lê o texto que ficou visível. Um `grep` no HTML não
  pegaria um CSS que esconde o idioma errado ou um texto que estoura a
  tela.
- **Por que só o Chromium?** O site é HTML, CSS e JS puros, sem recurso
  que mude de navegador para navegador; um navegador basta para o que
  esses testes provam e mantém o CI rápido. Firefox e WebKit entram se
  aparecer um defeito que só um deles mostra.
- **O que o axe não cobre?** O que precisa de gente: a ordem lógica da
  leitura, se o texto alternativo faz sentido, se a navegação pelo
  teclado é confortável. O axe acha cerca de metade dos problemas de
  acessibilidade; o resto é teste manual com leitor de tela.
- **Segurança do CI:** o token do fluxo só lê o repositório
  (`permissions: contents: read`), as actions vão fixadas pelo SHA do
  commit (uma tag pode ser movida para código malicioso; um SHA, não),
  o Node e o Playwright são versões exatas e nenhum segredo entra: o site
  não precisa de nenhum.

## Rodar no computador

```sh
cd tests
npm ci
npx playwright install chromium   # baixa o navegador (uma vez)
npm test
npm run report                    # abre o relatório HTML da última rodada
```

No Mac de 8 GB, só com nada pesado aberto ao lado (ver
`padroes/CAPACIDADE-DO-MAC.md`); o CI roda por padrão.
