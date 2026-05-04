#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseCommand } from "./commands";
import { copyExtensionBuild } from "./extension-build";
import { nativeHostName } from "./native/paths";
import { getStableAtlasPaths } from "./native/paths";
import {
	registerNativeHost,
	unregisterNativeHost,
} from "./native/registration";

type RuntimePaths = {
	extensionSourcePath: string;
	mcpEntryPath: string;
	nativeHostSourceEntryPath: string;
};

export async function main(argv = process.argv.slice(2)) {
	const runtimePaths = getRuntimePaths();

	try {
		const command = parseCommand(argv);

		switch (command.kind) {
			case "help":
				process.stdout.write(getHelpText());
				return 0;
			case "extension-build": {
				const result = copyExtensionBuild({
					outPath: command.outPath,
					permissions: command.permissions,
					sourcePath: runtimePaths.extensionSourcePath,
				});
				process.stdout.write(`Extension built to: ${result.outPath}\n`);
				return 0;
			}
			case "native-register": {
				const result = registerNativeHost({
					browser: command.browser,
					extensionId: command.extensionId,
					sourceEntryPath: runtimePaths.nativeHostSourceEntryPath,
				});

				process.stdout.write(
					[
						`Registered ${nativeHostName} for chrome-extension://${command.extensionId}/`,
						`Browsers: ${result.browsers.join(", ")}`,
						`Manifests: ${result.manifestPaths.join(", ")}`,
						`Host launcher: ${result.launcherPath}`,
					].join("\n"),
				);
				process.stdout.write("\n");
				return 0;
			}
			case "native-unregister": {
				const result = unregisterNativeHost({ browser: command.browser });
				process.stdout.write(
					[
						`Unregistered ${nativeHostName}`,
						`Browser: ${result.browser}`,
						`Manifest paths: ${result.manifestPaths.join(", ")}`,
					].join("\n"),
				);
				process.stdout.write("\n");
				return 0;
			}
			case "mcp":
				await import(pathToFileURL(runtimePaths.mcpEntryPath).href);
				return 0;
			case "doctor":
				return runDoctor(runtimePaths);
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		process.stderr.write(`ERROR: ${message}\n\n${getHelpText()}`);
		return 1;
	}
}

function getRuntimePaths(): RuntimePaths {
	const cliDir = dirname(fileURLToPath(import.meta.url));
	const builtPaths = {
		extensionSourcePath: resolve(cliDir, "../chrome-extension"),
		mcpEntryPath: resolve(cliDir, "../mcp/index.js"),
		nativeHostSourceEntryPath: resolve(
			cliDir,
			"../native-messaging-host/index.js",
		),
	};

	if (existsSync(builtPaths.extensionSourcePath)) {
		return builtPaths;
	}

	const repoRoot = resolve(cliDir, "../../..");

	return {
		extensionSourcePath: resolve(repoRoot, "dist/chrome-extension"),
		mcpEntryPath: resolve(repoRoot, "dist/mcp/index.js"),
		nativeHostSourceEntryPath: resolve(
			repoRoot,
			"dist/native-messaging-host/index.js",
		),
	};
}

function runDoctor(runtimePaths: RuntimePaths) {
	const stablePaths = getStableAtlasPaths();
	const checks = [
		["Packaged extension", runtimePaths.extensionSourcePath],
		["Packaged MCP server", runtimePaths.mcpEntryPath],
		["Packaged native host", runtimePaths.nativeHostSourceEntryPath],
		["Stable extension directory", stablePaths.extensionDir],
		["Stable native host launcher", stablePaths.nativeHostLauncherPath],
		["Node executable", process.execPath],
	] as const;
	let failed = false;

	for (const [label, path] of checks) {
		const ok = existsSync(path);
		failed ||= !ok;
		process.stdout.write(`${ok ? "ok" : "missing"} ${label}: ${path}\n`);
	}

	return failed ? 1 : 0;
}

function getHelpText() {
	return `atlas-browser-connect

Usage:
  atlas-browser-connect extension build [--out <path>] [--permissions <list>]
  atlas-browser-connect native register --extension-id <id> --browser <browser|all>
  atlas-browser-connect native unregister --browser <browser|all>
  atlas-browser-connect mcp
  atlas-browser-connect doctor

Browsers:
  chrome, chrome-beta, chrome-dev, chrome-canary, chrome-for-testing,
  edge, edge-beta, edge-dev, edge-canary,
  brave, brave-beta, brave-nightly,
  chromium, vivaldi, opera, arc
`;
}

const entrypoint = process.argv[1]
	? pathToFileURL(process.argv[1]).href
	: undefined;

if (entrypoint === import.meta.url) {
	process.exitCode = await main();
}
