#!/usr/bin/env bash
# O WebDriverAgent (WDA) no simulador do iOS, sem compilar: reaproveita um
# WebDriverAgentRunner-Runner.app já compilado para o simulador (o Appium
# deixa um em qualquer simulador em que já rodou, em
# ~/Library/Developer/CoreSimulator/Devices/<udid>/data/Containers/Bundle/Application/<id>/)
# e escreve o .xctestrun que o xcodebuild precisa para rodá-lo sem o projeto.
#
#   bash wda-sim.sh preparar <Runner.app> <pasta>   copia o runner e escreve o .xctestrun na pasta
#   bash wda-sim.sh subir <pasta> <udid>            imprime o comando do xcodebuild (pesado: rode-o
#                                                   à mão, com o saude antes; o hook do saude só vê
#                                                   o comando quando ele está na linha)
#   bash wda-sim.sh esperar [url]                   espera o WDA responder em url (padrão localhost:8100)
#   bash wda-sim.sh parar                           encerra o xcodebuild do WDA
#
# O WDA sobe na porta 8100 do Mac (o simulador compartilha a rede dele). O
# gravar.py fala com ele por HTTP. Nasceu em 10/10/2026, para a prova 2 do
# vídeo do Tem na Geladeira (os toques por script, para a tela ficar
# interativa na gravação).
set -euo pipefail

erro() { echo "✗ $*" >&2; exit 1; }
passo() { echo "→ $*"; }

preparar() {
  local runner=${1:?o Runner.app} pasta=${2:?a pasta de destino}
  [[ -d "$runner" && -d "$runner/PlugIns/WebDriverAgentRunner.xctest" ]] ||
    erro "não é um WebDriverAgentRunner-Runner.app completo: $runner"
  local plataforma
  plataforma=$(/usr/libexec/PlistBuddy -c 'Print :DTPlatformName' "$runner/Info.plist" 2>/dev/null || true)
  [[ "$plataforma" == iphonesimulator ]] || erro "o runner não é para o simulador (DTPlatformName=$plataforma)"
  local bundle
  bundle=$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$runner/Info.plist")
  mkdir -p "$pasta/Debug-iphonesimulator"
  rm -rf "$pasta/Debug-iphonesimulator/WebDriverAgentRunner-Runner.app"
  cp -R "$runner" "$pasta/Debug-iphonesimulator/"
  cat >"$pasta/WebDriverAgentRunner_sim.xctestrun" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>WebDriverAgentRunner</key>
	<dict>
		<key>BlueprintName</key>
		<string>WebDriverAgentRunner</string>
		<key>BlueprintProviderName</key>
		<string>WebDriverAgent</string>
		<key>BlueprintProviderRelativePath</key>
		<string>WebDriverAgent.xcodeproj</string>
		<key>CommandLineArguments</key>
		<array/>
		<key>DefaultTestExecutionTimeAllowance</key>
		<integer>600</integer>
		<key>DependentProductPaths</key>
		<array>
			<string>__TESTROOT__/Debug-iphonesimulator/WebDriverAgentRunner-Runner.app</string>
			<string>__TESTROOT__/Debug-iphonesimulator/WebDriverAgentRunner-Runner.app/PlugIns/WebDriverAgentRunner.xctest</string>
		</array>
		<key>EnvironmentVariables</key>
		<dict>
			<key>USE_PORT</key>
			<string>8100</string>
			<key>MJPEG_SERVER_PORT</key>
			<string></string>
			<key>OS_ACTIVITY_DT_MODE</key>
			<string>YES</string>
		</dict>
		<key>IsUITestBundle</key>
		<true/>
		<key>IsXCTRunnerHostedTestBundle</key>
		<true/>
		<key>OnlyTestIdentifiers</key>
		<array>
			<string>UITestingUITests/testRunner</string>
		</array>
		<key>ProductModuleName</key>
		<string>WebDriverAgentRunner</string>
		<key>RunOrder</key>
		<integer>0</integer>
		<key>TestBundlePath</key>
		<string>__TESTHOST__/PlugIns/WebDriverAgentRunner.xctest</string>
		<key>TestHostBundleIdentifier</key>
		<string>$bundle</string>
		<key>TestHostPath</key>
		<string>__TESTROOT__/Debug-iphonesimulator/WebDriverAgentRunner-Runner.app</string>
		<key>TestTimeoutsEnabled</key>
		<false/>
		<key>TestingEnvironmentVariables</key>
		<dict>
			<key>XCODE_SCHEME_NAME</key>
			<string>WebDriverAgentRunner</string>
		</dict>
		<key>ToolchainsSettingValue</key>
		<array/>
		<key>UITargetAppCommandLineArguments</key>
		<array/>
		<key>UITargetAppEnvironmentVariables</key>
		<dict/>
		<key>UseUITargetAppProvidedByTests</key>
		<true/>
	</dict>
	<key>__xctestrun_metadata__</key>
	<dict>
		<key>FormatVersion</key>
		<integer>1</integer>
	</dict>
</dict>
</plist>
EOF
  plutil -lint "$pasta/WebDriverAgentRunner_sim.xctestrun" >/dev/null || erro "o .xctestrun saiu inválido"
  passo "pronto: $pasta/WebDriverAgentRunner_sim.xctestrun (runner $bundle)"
}

subir() {
  local pasta=${1:?a pasta do preparar} udid=${2:?o udid do simulador ligado}
  echo "Rode à mão (pesado; o saude antes), e deixe em segundo plano:"
  echo "  xcodebuild test-without-building -xctestrun \"$pasta/WebDriverAgentRunner_sim.xctestrun\" -destination \"platform=iOS Simulator,id=$udid\" > \"$pasta/wda.log\" 2>&1 &"
  echo "Depois: bash $0 esperar"
}

esperar() {
  local url=${1:-http://localhost:8100} i
  for i in $(seq 1 120); do
    if curl -s -m 2 "$url/status" | grep -q '"ready"'; then passo "o WDA responde em $url"; return 0; fi
    sleep 1
  done
  erro "o WDA não respondeu em 120 s em $url (veja o wda.log)"
}

parar() {
  pkill -f 'xcodebuild test-without-building.*WebDriverAgentRunner_sim' && passo "WDA parado" || passo "já estava parado"
}

case ${1:-} in
  preparar) shift; preparar "$@" ;;
  subir) shift; subir "$@" ;;
  esperar) shift; esperar "$@" ;;
  parar) parar ;;
  *) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
