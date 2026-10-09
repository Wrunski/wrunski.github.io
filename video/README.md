# O vídeo de apresentação, feito em código

*Última atualização: 10/10/2026*

A prova de 10 s do vídeo de apresentação do Wagner (o caminho A de
`~/Desktop/Wagner/Carreira/linkedin/VIDEO-APRESENTACAO-OPCOES.md`, a
cena 3 do roteiro): o Tem na Geladeira numa moldura de celular em CSS, a
câmera aproxima do "Dá para fazer agora", a gravação abre uma receita e o
contador chega ao número de testes. Formato 4:5 (1080×1350), 30 qps,
10 s, sem som, com a cara do site: Inter, o verde `#1b7f4f` e o fundo
preto.

## Remotion, e não HyperFrames

O Remotion (4.0.534, fixado) é maduro, renderiza quadro a quadro de forma
determinística e tem o render no GitHub Actions documentado; a licença
própria é grátis para pessoa física. O HyperFrames é de abril de 2026 e
muda todo dia, e o que esta prova precisava (moldura em CSS, câmera com
easing, texto e um vídeo dentro da tela) o Remotion já faz com React e
CSS puro, reaproveitando os tokens do site.

## Como renderizar

O render roda no GitHub Actions (`.github/workflows/video.yml`), no ramo
`video-prova` ou à mão (`workflow_dispatch`), e o MP4 e os quadros-chave
saem como artefato do run (`cena-3`). O workflow segue a regra "CI
endurecido" do `padroes/PADRONIZACAO.md` e não publica nada: o site sai
do `main`, pelo Pages.

```
npm ci
npm run typecheck      # só os tipos: leve, roda no Mac
npm run render         # abre o Chrome Headless Shell: coisa pesada, saude antes
npm run conferir       # ffprobe/ffmpeg: duração, 1080×1350, h264, 1º quadro, quadros-chave
```

No Mac de 8 GB, o `render` só com o `saude` limpo e nada pesado junto;
o `conferir` é leve (só o ffmpeg).

## De onde vem cada coisa

- `public/laco.mp4`: cópia do `img/tem-na-geladeira-laco.mp4` do site
  (a gravação de 7,2 s do Início e da receita, 720×1564).
- `public/fontes/InterVariable.woff2`: a Inter 4.1, do pacote oficial
  (github.com/rsms/inter), com a licença OFL ao lado.
- `src/tokens.ts`: as cores do `css/site.css`, o texto da cena e o número
  de testes, que sai da ficha técnica do `historico/ACOMPANHAMENTO.md` e
  muda na véspera de cada render.
- `src/Celular.tsx`: a moldura `.phone` do site, em React.
- `src/Cena3.tsx`: a cena, com a câmera e os tempos em quadros.
