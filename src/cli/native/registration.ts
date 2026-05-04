import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

import type { SupportedBrowser, UnregisterBrowser } from "../commands";
import { supportedBrowsers } from "../commands";
import { getBrowserNativeHostTargets } from "./browser-targets";
import { installNativeHostFiles } from "./launcher";
import {
	nativeHostDescription,
	nativeHostManifestFile,
	nativeHostName,
} from "./paths";
import type { Environment, Platform } from "./paths";
import { getPathApi, getStableAtlasPaths } from "./paths";
import {
	removeWindowsRegistryKeyWithPowerShell,
	setWindowsRegistryValueWithPowerShell,
} from "./windows-registry";

// --- Manifest (inlined, was its own 20 LOC file) ---

type NativeHostManifestOptions = {
	extensionId: string;
	hostPath: string;
};

export function createNativeHostManifest({
	extensionId,
	hostPath,
}: NativeHostManifestOptions) {
	return {
		allowed_origins: [`chrome-extension://${extensionId}/`],
		description: nativeHostDescription,
		name: nativeHostName,
		path: hostPath,
		type: "stdio",
	};
}

// --- Registration ---

type RegisterNativeHostOptions = {
	browser: SupportedBrowser;
	env?: Environment;
	extensionId: string;
	homeDir?: string;
	nodePath?: string;
	platform?: Platform;
	setWindowsRegistryValue?: (registryKey: string, value: string) => void;
	sourceEntryPath: string;
};

type UnregisterNativeHostOptions = {
	browser: UnregisterBrowser;
	env?: Environment;
	homeDir?: string;
	platform?: Platform;
	removeWindowsRegistryKey?: (registryKey: string) => void;
};

export function registerNativeHost({
	browser,
	env = process.env,
	extensionId,
	homeDir = homedir(),
	nodePath = process.execPath,
	platform = process.platform,
	setWindowsRegistryValue = setWindowsRegistryValueWithPowerShell,
	sourceEntryPath,
}: RegisterNativeHostOptions) {
	const paths = getStableAtlasPaths({ env, homeDir, platform });
	const targets = getBrowserNativeHostTargets({
		browser,
		env,
		homeDir,
		platform,
	});
	const path = getPathApi(platform);
	const manifestDir =
		platform === "win32" ? paths.nativeManifestDir : targets.manifestDir;
	const manifestPath =
		platform === "win32"
			? paths.nativeManifestPath
			: path.join(manifestDir, nativeHostManifestFile);

	installNativeHostFiles({
		launcherPath: paths.nativeHostLauncherPath,
		nativeHostEntryPath: paths.nativeHostEntryPath,
		nodePath,
		platform,
		sourceEntryPath,
	});

	mkdirSync(manifestDir, { recursive: true });
	writeFileSync(
		manifestPath,
		`${JSON.stringify(
			createNativeHostManifest({
				extensionId,
				hostPath: paths.nativeHostLauncherPath,
			}),
			null,
			2,
		)}\n`,
		"utf8",
	);

	for (const registryKey of targets.registryKeys) {
		setWindowsRegistryValue(registryKey, manifestPath);
	}

	return {
		browser,
		launcherPath: paths.nativeHostLauncherPath,
		manifestPath,
		registryKeys: targets.registryKeys,
	};
}

export function unregisterNativeHost({
	browser,
	env = process.env,
	homeDir = homedir(),
	platform = process.platform,
	removeWindowsRegistryKey = removeWindowsRegistryKeyWithPowerShell,
}: UnregisterNativeHostOptions) {
	const browsers = browser === "all" ? [...supportedBrowsers] : [browser];
	const removedManifests = new Set<string>();
	const removedRegistryKeys: string[] = [];
	const path = getPathApi(platform);

	for (const browserTarget of browsers) {
		const paths = getStableAtlasPaths({ env, homeDir, platform });
		const targets = getBrowserNativeHostTargets({
			browser: browserTarget,
			env,
			homeDir,
			platform,
		});
		const manifestPath =
			platform === "win32"
				? paths.nativeManifestPath
				: path.join(targets.manifestDir, nativeHostManifestFile);

		for (const registryKey of targets.registryKeys) {
			removeWindowsRegistryKey(registryKey);
			removedRegistryKeys.push(registryKey);
		}

		rmSync(manifestPath, { force: true });
		removedManifests.add(manifestPath);
	}

	return {
		browser,
		manifestPaths: [...removedManifests],
		registryKeys: removedRegistryKeys,
	};
}
