import {
	chmodSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

import type { Platform } from "./paths";

type InstallNativeHostFilesOptions = {
	launcherPath: string;
	nativeHostEntryPath: string;
	nodePath: string;
	platform?: Platform;
	sourceEntryPath: string;
};

export function createNativeHostLauncher({
	nodePath,
	platform = process.platform,
}: {
	nodePath: string;
	platform?: Platform;
}) {
	if (platform === "win32") {
		return `@echo off\r\n"${nodePath}" "%~dp0index.mjs" %*\r\n`;
	}

	return `#!/usr/bin/env sh
set -eu
SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
exec "${escapeShellDoubleQuoted(nodePath)}" "$SCRIPT_DIR/index.mjs" "$@"
`;
}

export function installNativeHostFiles({
	launcherPath,
	nativeHostEntryPath,
	nodePath,
	platform = process.platform,
	sourceEntryPath,
}: InstallNativeHostFilesOptions) {
	if (!existsSync(sourceEntryPath)) {
		throw new Error(`Native host build not found: ${sourceEntryPath}`);
	}

	mkdirSync(dirname(nativeHostEntryPath), { recursive: true });
	copyFileSync(sourceEntryPath, nativeHostEntryPath);
	writeFileSync(
		launcherPath,
		createNativeHostLauncher({ nodePath, platform }),
		"utf8",
	);

	if (platform !== "win32") {
		chmodSync(launcherPath, 0o755);
	}
}

function escapeShellDoubleQuoted(value: string) {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
