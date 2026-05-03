#!/usr/bin/env bash
set -euo pipefail

HOST_NAME="com.qbytes.atlas_chrome_runtime"
DESCRIPTION="Atlas Chrome Runtime native messaging host"
declare -a BROWSERS=()
declare -a BROWSER_LABELS=()

usage() {
	echo "Usage: $0 <extension-id> [chrome|edge|brave|chromium|chrome-for-testing]" >&2
	exit 1
}

if [[ $# -lt 1 || $# -gt 2 ]]; then
	usage
fi

EXTENSION_ID="$1"
BROWSER="${2:-}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

add_browser() {
	BROWSERS+=("$1")
	BROWSER_LABELS+=("$2")
}

command_exists() {
	command -v "$1" >/dev/null 2>&1
}

path_exists() {
	[[ -e "$1" ]]
}

case "$(uname -s)" in
	MINGW* | MSYS* | CYGWIN*)
		OS="windows"
		HOST_BINARY="$ROOT_DIR/dist/native-messaging-host/atlas-native-messaging-host.exe"
		MANIFEST_PATH="$ROOT_DIR/dist/native-messaging-host/$HOST_NAME.json"

		command_exists reg.exe || {
			echo "reg.exe is required to register Native Messaging hosts on Windows." >&2
			exit 1
		}
		command_exists powershell.exe || {
			echo "powershell.exe is required to detect installed browsers on Windows." >&2
			exit 1
		}

		powershell.exe -NoProfile -Command "Get-Command chrome.exe -ErrorAction SilentlyContinue" >/dev/null 2>&1 &&
			add_browser "chrome" "Google Chrome"
		powershell.exe -NoProfile -Command "Get-Command msedge.exe -ErrorAction SilentlyContinue" >/dev/null 2>&1 &&
			add_browser "edge" "Microsoft Edge"
		powershell.exe -NoProfile -Command "Get-Command brave.exe -ErrorAction SilentlyContinue" >/dev/null 2>&1 &&
			add_browser "brave" "Brave"
		powershell.exe -NoProfile -Command "Get-Command chromium.exe -ErrorAction SilentlyContinue" >/dev/null 2>&1 &&
			add_browser "chromium" "Chromium"
		;;
	Darwin)
		OS="macos"
		HOST_BINARY="$ROOT_DIR/dist/native-messaging-host/atlas-native-messaging-host"

		path_exists "/Applications/Google Chrome.app" &&
			add_browser "chrome" "Google Chrome"
		path_exists "/Applications/Microsoft Edge.app" &&
			add_browser "edge" "Microsoft Edge"
		path_exists "/Applications/Brave Browser.app" &&
			add_browser "brave" "Brave"
		path_exists "/Applications/Chromium.app" &&
			add_browser "chromium" "Chromium"
		path_exists "/Applications/Google Chrome for Testing.app" &&
			add_browser "chrome-for-testing" "Google Chrome for Testing"
		;;
	Linux)
		OS="linux"
		HOST_BINARY="$ROOT_DIR/dist/native-messaging-host/atlas-native-messaging-host"

		command_exists google-chrome || command_exists google-chrome-stable &&
			add_browser "chrome" "Google Chrome"
		command_exists microsoft-edge || command_exists microsoft-edge-stable &&
			add_browser "edge" "Microsoft Edge"
		command_exists brave-browser &&
			add_browser "brave" "Brave"
		command_exists chromium || command_exists chromium-browser &&
			add_browser "chromium" "Chromium"
		command_exists chrome-for-testing &&
			add_browser "chrome-for-testing" "Google Chrome for Testing"
		;;
	*)
		echo "Unsupported OS: $(uname -s)" >&2
		exit 1
		;;
esac

if [[ -z "$BROWSER" ]]; then
	if [[ ${#BROWSERS[@]} -eq 0 ]]; then
		echo "No supported browsers were detected." >&2
		echo "Pass one explicitly: chrome, edge, brave, chromium, chrome-for-testing." >&2
		exit 1
	fi

	echo "Detected browsers:"
	for i in "${!BROWSERS[@]}"; do
		printf "  %d) %s\n" "$((i + 1))" "${BROWSER_LABELS[$i]}"
	done

	read -r -p "Select browser [1-${#BROWSERS[@]}]: " selection

	if ! [[ "$selection" =~ ^[0-9]+$ ]] ||
		((selection < 1 || selection > ${#BROWSERS[@]})); then
		echo "Invalid selection." >&2
		exit 1
	fi

	BROWSER="${BROWSERS[$((selection - 1))]}"
fi

case "$OS:$BROWSER" in
	windows:chrome)
		REGISTRY_PATH="HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\$HOST_NAME"
		;;
	windows:edge)
		REGISTRY_PATH="HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\$HOST_NAME"
		;;
	windows:brave)
		REGISTRY_PATH="HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\$HOST_NAME"
		;;
	windows:chromium)
		REGISTRY_PATH="HKCU\\Software\\Chromium\\NativeMessagingHosts\\$HOST_NAME"
		;;
	windows:chrome-for-testing)
		REGISTRY_PATH="HKCU\\Software\\Google\\Chrome for Testing\\NativeMessagingHosts\\$HOST_NAME"
		;;
	macos:chrome)
		MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
		;;
	macos:edge)
		MANIFEST_DIR="$HOME/Library/Application Support/Microsoft Edge/NativeMessagingHosts"
		;;
	macos:brave)
		MANIFEST_DIR="$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
		;;
	macos:chromium)
		MANIFEST_DIR="$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
		;;
	macos:chrome-for-testing)
		MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome for Testing/NativeMessagingHosts"
		;;
	linux:chrome)
		MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
		;;
	linux:edge)
		MANIFEST_DIR="$HOME/.config/microsoft-edge/NativeMessagingHosts"
		;;
	linux:brave)
		MANIFEST_DIR="$HOME/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
		;;
	linux:chromium)
		MANIFEST_DIR="$HOME/.config/chromium/NativeMessagingHosts"
		;;
	linux:chrome-for-testing)
		MANIFEST_DIR="$HOME/.config/google-chrome-for-testing/NativeMessagingHosts"
		;;
	*)
		usage
		;;
esac

if [[ "$OS" != "windows" ]]; then
	MANIFEST_PATH="$MANIFEST_DIR/$HOST_NAME.json"
fi

if [[ ! -f "$HOST_BINARY" ]]; then
	echo "Native host executable not found. Run 'bun run build' first." >&2
	echo "Missing: $HOST_BINARY" >&2
	exit 1
fi

if [[ "$OS" == "windows" ]]; then
	if command_exists cygpath; then
		HOST_BINARY_JSON="$(cygpath -w "$HOST_BINARY")"
		MANIFEST_PATH_REG="$(cygpath -w "$MANIFEST_PATH")"
	else
		HOST_BINARY_JSON="$HOST_BINARY"
		MANIFEST_PATH_REG="$MANIFEST_PATH"
	fi

	HOST_BINARY_JSON="${HOST_BINARY_JSON//\\/\\\\}"
	mkdir -p "$(dirname "$MANIFEST_PATH")"
else
	HOST_BINARY_JSON="$HOST_BINARY"
	mkdir -p "$MANIFEST_DIR"
	chmod +x "$HOST_BINARY"
fi

cat > "$MANIFEST_PATH" <<JSON
{
  "name": "$HOST_NAME",
  "description": "$DESCRIPTION",
  "path": "$HOST_BINARY_JSON",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$EXTENSION_ID/"]
}
JSON

if [[ "$OS" == "windows" ]]; then
	reg.exe ADD "$REGISTRY_PATH" /ve /t REG_SZ /d "$MANIFEST_PATH_REG" /f >/dev/null
fi

echo "Registered $HOST_NAME for chrome-extension://$EXTENSION_ID/"
echo "Browser: $BROWSER"
echo "Manifest: $MANIFEST_PATH"
