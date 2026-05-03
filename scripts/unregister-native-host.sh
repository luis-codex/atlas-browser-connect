#!/usr/bin/env bash
set -euo pipefail

usage() {
	echo "Usage: $0 [chrome|edge|brave|chromium|chrome-for-testing|--all]" >&2
	exit 1
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
	usage
fi

if [[ $# -gt 1 ]]; then
	usage
fi

BROWSER="${1:-}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/native-host-common.sh"

native_host_prepare_environment

if [[ "$BROWSER" == "--all" ]]; then
	for browser in "${SUPPORTED_BROWSERS[@]}"; do
		BROWSER="$browser"
		native_host_configure_browser_targets
		native_host_unregister_browser
	done

	echo "Unregistered $HOST_NAME from all supported browser targets."
	exit 0
fi

native_host_resolve_browser
native_host_configure_browser_targets
native_host_unregister_browser

echo "Unregistered $HOST_NAME"
echo "Browser: $BROWSER"
echo "Manifest: $MANIFEST_PATH"

if [[ "$OS" == "windows" ]]; then
	echo "Removed registry keys:"
	for registry_path in "${REGISTRY_PATHS[@]}"; do
		echo "  $registry_path"
	done
fi
