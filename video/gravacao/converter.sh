#!/usr/bin/env bash
# A gravação crua do simulador (app.mov, ritmo variável: só há quadro quando a
# tela muda) vira o app.mp4 que entra no Remotion: 30 qps fixos, a resolução
# nativa (1320×2868 no iPhone 17 Pro Max), H.264 em yuv420p, e o último
# quadro segurado por alguns segundos, para a composição poder ficar na
# receita no fim sem o vídeo acabar antes.
#
#   bash converter.sh <app.mov> <saida.mp4> [segurar_fim_s] [toques.json]
#
# Com o toques.json, grava nele o número de quadros do MP4 ("quadros"), que
# o Mestre.tsx lê para segurar o último quadro. Precisa do ffmpeg e do
# ffprobe (os de ~/.local/bin no Mac).
set -euo pipefail

FFMPEG=${FFMPEG:-$(command -v ffmpeg 2>/dev/null || echo "$HOME/.local/bin/ffmpeg")}
FFPROBE=${FFPROBE:-$(command -v ffprobe 2>/dev/null || echo "$HOME/.local/bin/ffprobe")}
ENTRADA=${1:?a gravação crua (app.mov)}
SAIDA=${2:?o MP4 de saída}
SEGURAR=${3:-6}
TOQUES=${4:-}

[[ -f "$ENTRADA" ]] || { echo "não achei $ENTRADA" >&2; exit 1; }
[[ -x "$FFMPEG" && -x "$FFPROBE" ]] || { echo "ffmpeg/ffprobe não encontrados" >&2; exit 1; }

# A largura e a altura ficam as da gravação (pares, para o yuv420p).
"$FFMPEG" -v error -y -i "$ENTRADA" -an \
  -vf "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1,tpad=stop_mode=clone:stop_duration=$SEGURAR,format=yuv420p" \
  -c:v libx264 -preset slow -crf 20 -profile:v high -pix_fmt yuv420p -movflags +faststart "$SAIDA"

"$FFPROBE" -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,nb_frames:format=duration,size -of default=nw=1 "$SAIDA"

if [[ -n "$TOQUES" ]]; then
  [[ -f "$TOQUES" ]] || { echo "não achei $TOQUES" >&2; exit 1; }
  quadros=$("$FFPROBE" -v error -select_streams v:0 -show_entries stream=nb_frames -of default=nw=1:nk=1 "$SAIDA")
  python3 - "$TOQUES" "$quadros" <<'PY'
import json, sys
caminho, quadros = sys.argv[1], int(sys.argv[2])
with open(caminho, encoding='utf-8') as f:
    dados = json.load(f)
dados['quadros'] = quadros
with open(caminho, 'w', encoding='utf-8') as f:
    json.dump(dados, f, ensure_ascii=False, indent=2)
    f.write('\n')
print(f'→ {caminho}: quadros = {quadros}')
PY
fi
