#!/usr/bin/env bash
# Confere o MP4 do mestre (duração, resolução 9:16, codec, qps, tamanho e 1º
# quadro com conteúdo) e tira os quadros-chave em PNG, ao lado do arquivo:
# cada um em 9:16 e no recorte central de 4:5 (1080×1350, de y = 285 a 1635),
# para conferir que o que importa cabe nos dois.
#
#   bash conferir.sh out/tem-na-geladeira-9x16.mp4
#
# Precisa do ffprobe e do ffmpeg (no runner do GitHub, o workflow os instala
# pelo apt; no Mac, os de ~/.local/bin). Sai com 1 se alguma checagem falhar.
set -euo pipefail

ARQ="${1:?informe o MP4, como out/tem-na-geladeira-9x16.mp4}"
[[ -f "$ARQ" ]] || { echo "arquivo não encontrado: $ARQ" >&2; exit 1; }
command -v ffprobe >/dev/null && command -v ffmpeg >/dev/null ||
  { echo "ffprobe e ffmpeg precisam estar no PATH" >&2; exit 1; }

falhas=0
ok() { echo "  ✓ $*"; }
erro() { echo "  ✗ $*" >&2; falhas=$((falhas + 1)); }

lido=$(ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,pix_fmt,r_frame_rate:format=duration,size \
  -of default=nw=1 "$ARQ")
pega() { printf '%s\n' "$lido" | awk -F= -v k="$1" '$1 == k { print $2; exit }'; }
codec=$(pega codec_name); w=$(pega width); h=$(pega height); pix=$(pega pix_fmt)
qps=$(pega r_frame_rate); dur=$(pega duration); tam=$(pega size)

echo "$ARQ"
[[ "$codec" == h264 ]] && ok "codec h264" || erro "codec $codec (esperado h264)"
[[ "$w" == 1080 && "$h" == 1920 ]] && ok "1080×1920 (9:16)" || erro "${w}×${h} (esperado 1080×1920)"
[[ "$pix" == yuv420p ]] && ok "yuv420p" || erro "pix_fmt $pix (esperado yuv420p)"
[[ "$qps" == "30/1" ]] && ok "30 qps" || erro "qps $qps (esperado 30/1)"
awk -v d="$dur" 'BEGIN { exit !(d >= 23.95 && d <= 24.05) }' &&
  ok "duração ${dur} s" || erro "duração ${dur} s (esperado 24,0)"
[[ "$tam" -gt 500000 && "$tam" -lt 60000000 ]] &&
  ok "tamanho $tam bytes" || erro "tamanho $tam bytes (esperado entre 500 KB e 60 MB)"

# O 1º quadro é o pôster: não pode ser preto. A luminância média (Y) de um
# quadro preto fica em 16; com o título e a tela do app ela passa de 24.
yavg=$(ffprobe -v error -f lavfi -i "movie=$ARQ,select=eq(n\,0),signalstats" \
  -show_entries frame_tags=lavfi.signalstats.YAVG -of csv=p=0 -read_intervals '%+#1' | tr -d ',')
awk -v y="$yavg" 'BEGIN { exit !(y + 0 > 24) }' &&
  ok "1º quadro com conteúdo (Y médio $yavg)" || erro "1º quadro escuro demais (Y médio $yavg)"

# Os quadros-chave: o pôster, a Despensa com o aviso, o Início depois, as
# porções e a chamada do fim. Cada um em 9:16 e no recorte de 4:5.
pasta="$(dirname "$ARQ")/quadros"
mkdir -p "$pasta"
for t in 0 6.9 10.9 16.5 22.5; do
  ffmpeg -v error -y -ss "$t" -i "$ARQ" -frames:v 1 "$pasta/quadro-${t}s.png"
  ffmpeg -v error -y -ss "$t" -i "$ARQ" -frames:v 1 -vf "crop=1080:1350:0:285" "$pasta/quadro-${t}s-4x5.png"
done
ok "quadros-chave em $pasta ($(ls "$pasta" | tr '\n' ' '))"

if [[ $falhas -gt 0 ]]; then
  echo "$falhas checagem(ns) falharam" >&2
  exit 1
fi
