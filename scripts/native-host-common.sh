#!/usr/bin/env bash

HOST_NAME="com.qbytes.atlas_chrome_runtime"
DESCRIPTION="Atlas Chrome Runtime native messaging host"
SUPPORTED_BROWSERS=(chrome edge brave chromium chrome-for-testing)

declare -a BROWSERS=()
declare -a BROWSER_LABELS=()
declare -a REGISTRY_PATHS=()

OS=""
HOST_BINARY=""
MANIFEST_DIR=""
MANIFEST_PATH=""

die() {
	echo "ERROR: $*" >&2
	exit 1
}

command_exists() {
	command -v "$1" >/dev/null 2>&1
}

path_exists() {
	[[ -e "$1" ]]
}

add_browser() {
	BROWSERS+=("$1")
	BROWSER_LABELS+=("$2")
}

native_host_browser_list() {
	local separator=""

	for browser in "${SUPPORTED_BROWSERS[@]}"; do
		printf "%s%s" "$separator" "$browser"
		separator=", "
	done
}

native_host_is_supported_browser() {
	local browser="$1"

	for supported_browser in "${SUPPORTED_BROWSERS[@]}"; do
		[[ "$browser" == "$supported_browser" ]] && return 0
	done

	return 1
}

windows_path_exists() {
	powershell.exe -NoProfile -Command "if (Test-Path -LiteralPath '$1') { exit 0 } else { exit 1 }" >/dev/null 2>&1
}

windows_registry_key_exists() {
	powershell.exe -NoProfile -Command "if (Test-Path -LiteralPath 'Registry::$1') { exit 0 } else { exit 1 }" >/dev/null 2>&1
}

set_windows_registry_key() {
	local registry_path="$1"
	local manifest_path="$2"

	powershell.exe -NoProfile -Command "\$key = 'Registry::$registry_path'; New-Item -Path \$key -Force | Out-Null; Set-Item -Path \$key -Value '$manifest_path'" >/dev/null
}

remove_windows_registry_key() {
	local registry_path="$1"

	powershell.exe -NoProfile -Command "\$key = 'Registry::$registry_path'; if (Test-Path -LiteralPath \$key) { Remove-Item -LiteralPath \$key -Force -Recurse }" >/dev/null
}

native_host_detect_os() {
	case "$(uname -s)" in
		MINGW* | MSYS* | CYGWIN*)
			OS="windows"
			;;
		Darwin)
			OS="macos"
			;;
		Linux)
			OS="linux"
			;;
		*)
			die "Unsupported OS: $(uname -s)"
			;;
	esac
}

native_host_set_base_paths() {
	case "$OS" in
		windows)
			local local_app_data="${LOCALAPPDATA:-}"
			HOST_BINARY="$ROOT_DIR/dist/native-messaging-host/atlas-native-messaging-host.exe"

			if command_exists cygpath && [[ -n "$local_app_data" ]]; then
				MANIFEST_DIR="$(cygpath -u "$local_app_data")/atlas-browser-connect/NativeMessagingHosts"
			else
				MANIFEST_DIR="$ROOT_DIR/.native-messaging-hosts"
			fi

			MANIFEST_PATH="$MANIFEST_DIR/$HOST_NAME.json"
			;;
		macos | linux)
			HOST_BINARY="$ROOT_DIR/dist/native-messaging-host/atlas-native-messaging-host"
			;;
	esac
}

native_host_detect_windows_browsers() {
	command_exists powershell.exe ||
		die "powershell.exe is required to configure Native Messaging hosts on Windows."

	local local_app_data="${LOCALAPPDATA:-}"
	local program_files="${PROGRAMFILES:-C:\\Program Files}"
	local program_files_x86="C:\\Program Files (x86)"

	if powershell.exe -NoProfile -Command "Get-Command chrome.exe -ErrorAction SilentlyContinue" >/dev/null 2>&1 ||
		windows_path_exists "$local_app_data\\Google\\Chrome\\Application\\chrome.exe" ||
		windows_path_exists "$program_files\\Google\\Chrome\\Application\\chrome.exe" ||
		windows_path_exists "$program_files_x86\\Google\\Chrome\\Application\\chrome.exe" ||
		windows_registry_key_exists "HKCU\\Software\\Google\\Chrome" ||
		windows_registry_key_exists "HKLM\\Software\\Google\\Chrome"; then
		add_browser "chrome" "Google Chrome"
	fi

	if powershell.exe -NoProfile -Command "Get-Command msedge.exe -ErrorAction SilentlyContinue" >/dev/null 2>&1 ||
		windows_path_exists "$program_files\\Microsoft\\Edge\\Application\\msedge.exe" ||
		windows_path_exists "$program_files_x86\\Microsoft\\Edge\\Application\\msedge.exe" ||
		windows_registry_key_exists "HKCU\\Software\\Microsoft\\Edge" ||
		windows_registry_key_exists "HKLM\\Software\\Microsoft\\Edge"; then
		add_browser "edge" "Microsoft Edge"
	fi

	if powershell.exe -NoProfile -Command "Get-Command brave.exe -ErrorAction SilentlyContinue" >/dev/null 2>&1 ||
		windows_path_exists "$local_app_data\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" ||
		windows_path_exists "$program_files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" ||
		windows_path_exists "$program_files_x86\\BraveSoftware\\Brave-Browser\\Application\\brave.exe" ||
		windows_registry_key_exists "HKCU\\Software\\BraveSoftware\\Brave-Browser" ||
		windows_registry_key_exists "HKLM\\Software\\BraveSoftware\\Brave-Browser"; then
		add_browser "brave" "Brave"
	fi

	if powershell.exe -NoProfile -Command "Get-Command chromium.exe -ErrorAction SilentlyContinue" >/dev/null 2>&1 ||
		windows_path_exists "$local_app_data\\Chromium\\Application\\chromium.exe" ||
		windows_path_exists "$program_files\\Chromium\\Application\\chromium.exe" ||
		windows_path_exists "$program_files_x86\\Chromium\\Application\\chromium.exe" ||
		windows_registry_key_exists "HKCU\\Software\\Chromium" ||
		windows_registry_key_exists "HKLM\\Software\\Chromium"; then
		add_browser "chromium" "Chromium"
	fi
}

native_host_detect_macos_browsers() {
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
}

native_host_detect_linux_browsers() {
	if command_exists google-chrome || command_exists google-chrome-stable; then
		add_browser "chrome" "Google Chrome"
	fi
	if command_exists microsoft-edge || command_exists microsoft-edge-stable; then
		add_browser "edge" "Microsoft Edge"
	fi
	if command_exists brave-browser; then
		add_browser "brave" "Brave"
	fi
	if command_exists chromium || command_exists chromium-browser; then
		add_browser "chromium" "Chromium"
	fi
	if command_exists chrome-for-testing; then
		add_browser "chrome-for-testing" "Google Chrome for Testing"
	fi
}

native_host_detect_browsers() {
	BROWSERS=()
	BROWSER_LABELS=()

	case "$OS" in
		windows)
			native_host_detect_windows_browsers
			;;
		macos)
			native_host_detect_macos_browsers
			;;
		linux)
			native_host_detect_linux_browsers
			;;
	esac
}

native_host_prepare_environment() {
	native_host_detect_os
	native_host_set_base_paths
	native_host_detect_browsers
}

native_host_resolve_browser() {
	if [[ -n "$BROWSER" ]]; then
		native_host_is_supported_browser "$BROWSER" ||
			die "Unsupported browser: $BROWSER. Supported values: $(native_host_browser_list)."
		return
	fi

	if [[ ${#BROWSERS[@]} -eq 0 ]]; then
		die "No supported browsers were detected. Pass one explicitly: $(native_host_browser_list)."
	fi

	echo "Detected browsers:"
	for i in "${!BROWSERS[@]}"; do
		printf "  %d) %s\n" "$((i + 1))" "${BROWSER_LABELS[$i]}"
	done

	read -r -p "Select browser [1-${#BROWSERS[@]}]: " selection

	if ! [[ "$selection" =~ ^[0-9]+$ ]] ||
		((selection < 1 || selection > ${#BROWSERS[@]})); then
		die "Invalid selection."
	fi

	BROWSER="${BROWSERS[$((selection - 1))]}"
}

native_host_configure_browser_targets() {
	REGISTRY_PATHS=()

	case "$OS:$BROWSER" in
		windows:chrome)
			REGISTRY_PATHS=(
				"HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\WOW6432Node\\Google\\Chrome\\NativeMessagingHosts\\$HOST_NAME"
			)
			;;
		windows:edge)
			REGISTRY_PATHS=(
				"HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\WOW6432Node\\Microsoft\\Edge\\NativeMessagingHosts\\$HOST_NAME"
			)
			;;
		windows:brave)
			REGISTRY_PATHS=(
				"HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\BraveSoftware\\Brave\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\Chromium\\NativeMessagingHosts\\$HOST_NAME"
			)
			;;
		windows:chromium)
			REGISTRY_PATHS=(
				"HKCU\\Software\\Chromium\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\WOW6432Node\\Chromium\\NativeMessagingHosts\\$HOST_NAME"
			)
			;;
		windows:chrome-for-testing)
			REGISTRY_PATHS=(
				"HKCU\\Software\\Google\\Chrome for Testing\\NativeMessagingHosts\\$HOST_NAME"
				"HKCU\\Software\\WOW6432Node\\Google\\Chrome for Testing\\NativeMessagingHosts\\$HOST_NAME"
			)
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
			die "Unsupported browser target: $OS:$BROWSER"
			;;
	esac

	if [[ "$OS" != "windows" ]]; then
		MANIFEST_PATH="$MANIFEST_DIR/$HOST_NAME.json"
	fi
}

native_host_require_binary() {
	if [[ ! -f "$HOST_BINARY" ]]; then
		echo "Native host executable not found. Run 'bun run build' first." >&2
		echo "Missing: $HOST_BINARY" >&2
		exit 1
	fi
}

native_host_manifest_binary_path_json() {
	if [[ "$OS" == "windows" ]]; then
		if command_exists cygpath; then
			local host_binary_json
			host_binary_json="$(cygpath -w "$HOST_BINARY")"
			echo "${host_binary_json//\\/\\\\}"
		else
			echo "${HOST_BINARY//\\/\\\\}"
		fi
	else
		echo "$HOST_BINARY"
	fi
}

native_host_manifest_path_for_registry() {
	if command_exists cygpath; then
		cygpath -w "$MANIFEST_PATH"
	else
		echo "$MANIFEST_PATH"
	fi
}

write_native_host_manifest() {
	local extension_id="$1"
	local host_binary_json

	host_binary_json="$(native_host_manifest_binary_path_json)"

	mkdir -p "$MANIFEST_DIR"

	if [[ "$OS" != "windows" ]]; then
		chmod +x "$HOST_BINARY"
	fi

	cat > "$MANIFEST_PATH" <<JSON
{
  "name": "$HOST_NAME",
  "description": "$DESCRIPTION",
  "path": "$host_binary_json",
  "type": "stdio",
  "allowed_origins": ["chrome-extension://$extension_id/"]
}
JSON
}

register_native_host_browser() {
	if [[ "$OS" != "windows" ]]; then
		return
	fi

	local manifest_path_registry
	manifest_path_registry="$(native_host_manifest_path_for_registry)"

	for registry_path in "${REGISTRY_PATHS[@]}"; do
		set_windows_registry_key "$registry_path" "$manifest_path_registry"
	done
}

remove_native_host_manifest() {
	rm -f "$MANIFEST_PATH"

	if [[ "$OS" == "windows" ]]; then
		rmdir "$MANIFEST_DIR" 2>/dev/null || true
		rmdir "$(dirname "$MANIFEST_DIR")" 2>/dev/null || true
	fi
}

native_host_unregister_browser() {
	if [[ "$OS" == "windows" ]]; then
		for registry_path in "${REGISTRY_PATHS[@]}"; do
			remove_windows_registry_key "$registry_path"
		done
	fi

	remove_native_host_manifest
}
