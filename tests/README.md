# Testes do site

*Última atualização: 29/10/2026*

Testes de ponta a ponta do site wrunski.github.io, escritos com o
[Playwright](https://playwright.dev) e rodados pelo GitHub Actions a cada
`push` e a cada pull request (`.github/workflows/site.yml`). Eles sobem o
site numa porta local, com o servidor estático do Python, e abrem cada
página num Chromium de verdade, como um visitante faria. Nada depende da
internet, fora as fontes do Google que a própria página carrega.

## O que cada teste prova

| Arquivo | O que prova, em uma frase |
|---|---|
| `paginas.spec.ts` | As cinco páginas (`/`, `/sobre/`, as duas dos apps e `/testes/`) e a do 404 respondem com 200, têm título e mostram um único título principal; cada uma tem a descrição (`meta description`) nos três idiomas e declara o ícone do site (SVG, PNG e o do iPhone), que existe. As cinco têm o cartão de prévia completo (Open Graph e Twitter: título, descrição, imagem de 1200×630 que existe no site e o alt da imagem). A página do 404, que o GitHub Pages serve em qualquer endereço que não existe, usa só caminhos absolutos e é `noindex`. O `sitemap.xml` lista exatamente as cinco páginas, e o `robots.txt` libera o site e aponta para ele. Um endereço inventado devolve 404, para o teste dos links saber a diferença entre um link que funciona e um quebrado |
| `links.spec.ts` | Nenhum link interno leva a uma página que não existe, e toda âncora (`#alguma-coisa`) tem destino na página. Os links externos são HTTPS e, quando abrem em nova aba, levam `rel="noopener"` (a página de fora não ganha acesso à nossa). As imagens, o CSS, o JS, os ícones e o vídeo de cada página carregam |
| `idiomas.spec.ts` | Os botões PT, EN e ES trocam a página inteira: o texto visível, o `<html lang>` que o leitor de tela usa, o título da aba (nas páginas que o traduzem; nas dos apps ele é o nome do app), a descrição da página e o botão marcado. A escolha fica salva na chave `lang` do `localStorage`, vale nas seis páginas e sobrevive a recarregar. Sem escolha salva, o site segue o idioma do navegador. O `localStorage` guarda só essa chave |
| `celular.spec.ts` | Numa tela de 375 px (o iPhone pequeno), nenhuma página rola de lado, em nenhum dos três idiomas. O menu do celular aparece, abre e fecha pelo teclado (Esc) |
| `tema.spec.ts` | Quando o sistema está no modo escuro, o fundo fica preto e o texto claro; no claro, o contrário. O teste mede a cor que o navegador aplicou, e não o que o CSS promete |
| `ancoras.spec.ts` | As âncoras `#trabalho`, `#work` e `#trabajo` do site antigo, que já foram enviadas em currículo e mensagens, existem uma vez só, rolam a página até os apps e ficam logo antes da seção do Organizador |
| `teste-publico.spec.ts` | Na `/testes/`, nos três idiomas, o cartão Android do Organizador traz os dois passos do teste público, como o do Tem na Geladeira: o link do Grupo do Google dos testadores e o do teste na Google Play, com o pedido dos 14 dias. E o "por convite" de antes (em inglês, "by invitation"; em espanhol, "por invitación") não volta à `/testes/` nem à página do app. Nos dois apps, o cartão do Android vem antes do iPhone; o do iPhone do Organizador diz que o teste começa quando a Apple aprovar a versão (o grupo externo do TestFlight só recebe versão aprovada); e "Achou algo estranho?" leva ao formulário anônimo de feedback do teste do Organizador, em nova aba |
| `promessas.spec.ts` | O que o site promete sobre o Organizador vale para a versão que chega a quem lê (as decisões de 25/10/2026). As três frases de antes ("nenhum lançamento sai do seu celular", "tudo fica no seu celular" e "os lançamentos ficam no seu celular", e as de inglês e espanhol) não estão no Início, na página do app nem na `/testes/`, e no lugar delas está "Seus lançamentos nunca chegam até nós", no texto, na descrição e no cartão de prévia. A `/testes/` não diz "de graça", "grátis", "free" nem "gratis" em lugar nenhum da página, fica o "sem anúncios e sem conta" e o bloco do Organizador conta da compra única opcional, o Pro. A captura escura da 1.7.0 (`organizador-escuro`) não está no Início nem na página do app, até as capturas da 2.1. E a compra do Pro da 2.1 (a decisão de 28/10/2026): na página do app, o título da internet conta três funções ("Três funções usam a internet, e nenhuma leva seus lançamentos"), o parágrafo dele diz que a compra é feita e conferida pela loja do aparelho, e o título de antes, o das duas funções, não volta; no alto da página do app e no cartão do Organizador no Início, a linha do Pro diz o que a compra libera, e o "funciona sem internet" vem com a exceção, a cotação do conversor e a compra, sem a frase de antes, que não a tinha |
| `csp.spec.ts` | Cada página traz a Content-Security-Policy em `<meta>`: por padrão só o próprio site, script só do próprio site, sem `unsafe-inline` nem `eval`, e de fora só as fontes do Google. E a página carrega inteira sem o navegador reclamar de nenhuma violação |
| `acessibilidade.spec.ts` | O [axe-core](https://github.com/dequelabs/axe-core), o mesmo motor do Lighthouse, roda as regras das WCAG 2.2 (níveis A e AA) em cada página, no tema claro e com a animação de entrada desligada (senão ele mede o contraste no meio do esmaecimento e acusa um defeito que não existe). Qualquer violação séria ou crítica (contraste insuficiente, imagem sem alternativa, botão sem nome, controle fora do teclado) reprova. As menores ficam anexadas ao relatório, para revisão |

A lista das páginas e dos idiomas fica em `paginas.ts`: uma página nova
entra ali e passa por todos os testes. A página do 404 fica numa lista à
parte (`PAGINA_404`), porque não tem cartão de prévia; os outros testes a
percorrem junto com as cinco (`PAGINAS_E_404`).

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
