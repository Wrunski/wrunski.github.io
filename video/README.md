# O vídeo do Tem na Geladeira, feito em código

*Última atualização: 10/10/2026*

A prova 2 do vídeo do Tem na Geladeira (decisão do Wagner em 10/10/2026,
depois da prova 1: o vídeo vende e apresenta o app para quem vai usar, em
português, sem a parte dos testes). O app numa moldura de celular em CSS,
com a gravação de verdade do simulador e os toques visíveis: marcar o que
tem em casa, ver a lista "Dá para fazer agora" mudar, abrir a receita e
ajustar as porções; no fim, a chamada para baixar o beta (Google Play e
TestFlight). O mestre é 9:16 (1080×1920), 30 qps, 24 s, sem som, com a
cara do site: Inter, o verde `#1b7f4f` e o fundo preto. Os cortes de cada
lugar (as lojas, os Reels, o LinkedIn, o site) ficam para a parte 2; por
isso tudo o que importa fica na faixa central de 4:5 (de y = 285 a 1635),
e o `conferir.sh` recorta essa faixa de cada quadro-chave.

## O texto que aparece no vídeo

| Quando | Texto |
|---|---|
| 0 a 2,2 s (o pôster) | Tem na Geladeira / Receitas com o que você tem |
| 2,6 a 9,0 s | Marque o que você tem em casa. |
| 9,5 a 12,2 s | Veja o que dá para fazer agora. |
| 12,7 a 18,4 s | Abra a receita e ajuste as porções. |
| 19,4 a 24 s | Tem na Geladeira / Baixe o beta / Google Play e TestFlight |

A etiqueta "Tem na Geladeira" acompanha as três legendas. Os textos moram
no `src/tokens.ts`.

## Os três ajustes da revisão da prova 1

1. **Texto da tela atrás da etiqueta:** a legenda e a etiqueta agora ficam
   só sobre o preto fechado (a faixa de baixo fecha em preto antes delas),
   e a câmera enquadra cada cena acima da faixa.
2. **Gravação macia na aproximação:** a gravação é na resolução nativa do
   simulador (1320×2868 no iPhone 17 Pro Max), e a câmera chega a 1,5× de
   uma tela de 560 px: 840 px de uma fonte de 1320.
3. **O canto de cima, à direita, da moldura:** o `width: w` com `padding`
   dependia do `box-sizing`, e a moldura saía com a largura da tela, sem o
   bezel da direita. As medidas agora são explícitas (`Celular.tsx`).

## Remotion, e não HyperFrames

O Remotion (4.0.534, fixado) é maduro, renderiza quadro a quadro de forma
determinística e tem o render no GitHub Actions documentado; a licença
própria é grátis para pessoa física. O HyperFrames é de abril de 2026 e
muda todo dia, e o que esta prova precisa (moldura em CSS, câmera com
easing, texto e um vídeo dentro da tela) o Remotion já faz com React e
CSS puro, reaproveitando os tokens do site.

## Como renderizar

O render roda no GitHub Actions (`.github/workflows/video.yml`), no ramo
`video-prova` ou à mão (`workflow_dispatch`), e o MP4 e os quadros-chave
saem como artefato do run (`prova-2`). O workflow segue a regra "CI
endurecido" do `padroes/PADRONIZACAO.md` e não publica nada: o site sai
do `main`, pelo Pages.

```
npm ci
npm run typecheck      # só os tipos: leve, roda no Mac
npm run render         # abre o Chrome Headless Shell: coisa pesada, saude antes
npm run conferir       # ffprobe/ffmpeg: duração, 1080×1920, h264, 1º quadro, quadros-chave em 9:16 e 4:5
```

No Mac de 8 GB, o `render` só com o `saude` limpo e nada pesado junto;
o `conferir` é leve (só o ffmpeg).

## Como gravar a cena de novo (`gravacao/`)

A gravação é do simulador do iOS, com os toques por script (o
WebDriverAgent, o mesmo do `aparelho.sh iphone`, mas no simulador), sem
compilar nada:

1. `saude`, e o simulador ligado: `xcrun simctl boot <udid>` (o iPhone 17
   Pro Max, iOS 26.5). Pesado: uma coisa por vez.
2. O app, de um `.app` já compilado para o simulador (o Expo deixa um em
   `~/Library/Developer/CoreSimulator/Devices/<udid>/data/Containers/Bundle/Application/<id>/TemnaGeladeira.app`
   do simulador em que rodou): `xcrun simctl uninstall <udid> com.wrunski.temnageladeira`
   e `xcrun simctl install <udid> <TemnaGeladeira.app>`, para começar limpo
   (a tela de primeira abertura precisa aparecer).
3. O WDA: `bash gravacao/wda-sim.sh preparar <WebDriverAgentRunner-Runner.app> <pasta>`
   (o runner já compilado para o simulador, que o Appium deixa no mesmo lugar
   dos apps), e o `xcodebuild test-without-building` que o `wda-sim.sh subir`
   imprime, em segundo plano; `bash gravacao/wda-sim.sh esperar`.
4. `python3 gravacao/gravar.py --simulador <udid> --saida <pasta>`: marca os
   básicos de exemplo na primeira abertura, grava com o
   `xcrun simctl io recordVideo` e toca a coreografia (a Despensa, "frango",
   "ovo", o Início, "Ovos com tomate à chinesa" e duas vezes "Mais porções").
   Sai `app.mov` e `toques.json`.
5. `bash gravacao/converter.sh <pasta>/app.mov public/app.mp4 6 <pasta>/toques.json`:
   30 qps fixos, a resolução nativa, o último quadro segurado por 6 s, e o
   número de quadros gravado no `toques.json`, que vai para `src/toques.json`.
6. `bash gravacao/wda-sim.sh parar`, `xcrun simctl shutdown <udid>` e a `folga`.

## De onde vem cada coisa

- `public/app.mp4`: a gravação do simulador (iPhone 17 Pro Max, iOS 26.5),
  convertida pelo `gravacao/converter.sh`. Dados de exemplo do próprio
  catálogo do app (os básicos marcados na primeira abertura), nada pessoal.
- `src/toques.json`: o tempo e o ponto de cada toque da gravação, em pontos
  da tela (440×956), escrito pelo `gravacao/gravar.py`.
- `public/fontes/InterVariable.woff2`: a Inter 4.1, do pacote oficial
  (github.com/rsms/inter), com a licença OFL ao lado.
- `src/tokens.ts`: as cores do `css/site.css`, as medidas do mestre e o
  texto do vídeo.
- `src/Celular.tsx`: a moldura `.phone` do site, em React.
- `src/Toque.tsx`: o toque visível (um disco e um anel), sincronizado pelo
  `toques.json`.
- `src/Mestre.tsx`: a composição, com a câmera por quadros-chave, as
  legendas e a chamada do fim.
