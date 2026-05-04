import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";

import { getBrowserNativeHostTargets } from "../../src/cli/native/browser-targets";
import {
	createNativeHostLauncher,
	installNativeHostFiles,
} from "../../src/cli/native/launcher";
import { createNativeHostManifest } from "../../src/cli/native/registration";
import { getStableAtlasPaths } from "../../src/cli/native/paths";

const extensionId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

test("resolves stable native host paths outside the npx package cache", () => {
	expect(
		getStableAtlasPaths({
			env: { LOCALAPPDATA: "C:\\Users\\Ada\\AppData\\Local" },
			homeDir: "C:\\Users\\Ada",
			platform: "win32",
		}).nativeHostLauncherPath,
	).toBe(
		"C:\\Users\\Ada\\AppData\\Local\\atlas-browser-connect\\native-host\\atlas-native-messaging-host.bat",
	);
	expect(
		getStableAtlasPaths({
			env: { LOCALAPPDATA: "C:\\Users\\Ada\\AppData\\Local" },
			homeDir: "C:\\Users\\Ada",
			platform: "win32",
		}).nativeHostEntryPath,
	).toBe(
		"C:\\Users\\Ada\\AppData\\Local\\atlas-browser-connect\\native-host\\index.mjs",
	);

	expect(
		getStableAtlasPaths({
			env: {},
			homeDir: "/Users/ada",
			platform: "darwin",
		}).nativeHostLauncherPath,
	).toBe(
		"/Users/ada/Library/Application Support/atlas-browser-connect/native-host/atlas-native-messaging-host",
	);

	expect(
		getStableAtlasPaths({
			env: {},
			homeDir: "/home/ada",
			platform: "linux",
		}).nativeHostLauncherPath,
	).toBe(
		"/home/ada/.local/share/atlas-browser-connect/native-host/atlas-native-messaging-host",
	);
});

test("creates native messaging manifest for the loaded extension id", () => {
	expect(
		createNativeHostManifest({
			extensionId,
			hostPath: "C:\\Users\\Ada\\AppData\\Local\\atlas\\host.bat",
		}),
	).toEqual({
		allowed_origins: [`chrome-extension://${extensionId}/`],
		description: "Atlas Browser Connect native messaging host",
		name: "com.qbytes.atlas_chrome_runtime",
		path: "C:\\Users\\Ada\\AppData\\Local\\atlas\\host.bat",
		type: "stdio",
	});
});

test("creates platform launchers that pin the current Node executable", () => {
	expect(
		createNativeHostLauncher({
			nodePath: "C:\\Program Files\\nodejs\\node.exe",
			platform: "win32",
		}),
	).toBe(
		'@echo off\r\n"C:\\Program Files\\nodejs\\node.exe" "%~dp0index.mjs" %*\r\n',
	);

	expect(
		createNativeHostLauncher({
			nodePath: "/usr/local/bin/node",
			platform: "linux",
		}),
	).toContain('exec "/usr/local/bin/node" "$SCRIPT_DIR/index.mjs" "$@"');
});

test("installs the native host JavaScript and launcher into a provided stable directory", () => {
	const root = mkdtempSync(join(tmpdir(), "atlas-native-host-test-"));
	const source = join(root, "package-cache", "index.js");
	const targetDir = join(root, "stable-host");
	const launcherPath = join(targetDir, "atlas-native-messaging-host");
	const nativeHostEntryPath = join(targetDir, "index.mjs");

	try {
		mkdirSync(join(root, "package-cache"), { recursive: true });
		writeFileSync(source, "console.log('host');");

		installNativeHostFiles({
			launcherPath,
			nativeHostEntryPath,
			nodePath: "/usr/local/bin/node",
			platform: "linux",
			sourceEntryPath: source,
		});

		expect(readFileSync(nativeHostEntryPath, "utf8")).toBe(
			"console.log('host');",
		);
		expect(readFileSync(launcherPath, "utf8")).toContain(
			'"/usr/local/bin/node"',
		);
		expect(existsSync(launcherPath)).toBe(true);
	} finally {
		rmSync(root, { force: true, recursive: true });
	}
});

test("resolves browser manifest targets without requiring prompts", () => {
	expect(
		getBrowserNativeHostTargets({
			browser: "chrome",
			homeDir: "/home/ada",
			platform: "linux",
		}),
	).toEqual({
		manifestDir: "/home/ada/.config/google-chrome/NativeMessagingHosts",
		registryKeys: [],
	});

	expect(
		getBrowserNativeHostTargets({
			browser: "chrome",
			homeDir: "C:\\Users\\Ada",
			platform: "win32",
		}).registryKeys,
	).toEqual([
		"HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.qbytes.atlas_chrome_runtime",
		"HKCU\\Software\\WOW6432Node\\Google\\Chrome\\NativeMessagingHosts\\com.qbytes.atlas_chrome_runtime",
	]);
});
