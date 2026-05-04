import { homedir } from "node:os";

import type { SupportedBrowser } from "../commands";
import { nativeHostName } from "./paths";
import type { Environment, Platform } from "./paths";
import { getPathApi, getStableAtlasPaths } from "./paths";

type BrowserTargetOptions = {
	browser: SupportedBrowser;
	env?: Environment;
	homeDir?: string;
	platform?: Platform;
};

type BrowserNativeHostTargets = {
	manifestDir: string;
	registryKeys: string[];
};

// --- Data tables ---

/**
 * Relative path segments from the platform base dir to each browser's
 * NativeMessagingHosts directory. Keyed by browser, then by platform.
 */
const MANIFEST_PATHS: Record<
	SupportedBrowser,
	{ darwin: string[]; linux: string[] }
> = {
	chrome: {
		darwin: ["Google", "Chrome", "NativeMessagingHosts"],
		linux: [".config", "google-chrome", "NativeMessagingHosts"],
	},
	edge: {
		darwin: ["Microsoft Edge", "NativeMessagingHosts"],
		linux: [".config", "microsoft-edge", "NativeMessagingHosts"],
	},
	brave: {
		darwin: ["BraveSoftware", "Brave-Browser", "NativeMessagingHosts"],
		linux: [
			".config",
			"BraveSoftware",
			"Brave-Browser",
			"NativeMessagingHosts",
		],
	},
	chromium: {
		darwin: ["Chromium", "NativeMessagingHosts"],
		linux: [".config", "chromium", "NativeMessagingHosts"],
	},
	"chrome-for-testing": {
		darwin: ["Google", "Chrome for Testing", "NativeMessagingHosts"],
		linux: [".config", "google-chrome-for-testing", "NativeMessagingHosts"],
	},
};

/**
 * Windows registry key prefixes for each browser's NativeMessagingHosts.
 * The native host name is appended to each prefix at runtime.
 */
const REGISTRY_PREFIXES: Record<SupportedBrowser, string[]> = {
	chrome: [
		"HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Google\\Chrome\\NativeMessagingHosts",
	],
	edge: [
		"HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Microsoft\\Edge\\NativeMessagingHosts",
	],
	brave: [
		"HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts",
		"HKCU\\Software\\BraveSoftware\\Brave\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave\\NativeMessagingHosts",
	],
	chromium: [
		"HKCU\\Software\\Chromium\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Chromium\\NativeMessagingHosts",
	],
	"chrome-for-testing": [
		"HKCU\\Software\\Google\\Chrome for Testing\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Google\\Chrome for Testing\\NativeMessagingHosts",
	],
};

// --- Public API ---

export function getBrowserNativeHostTargets({
	browser,
	env = process.env,
	homeDir = homedir(),
	platform = process.platform,
}: BrowserTargetOptions): BrowserNativeHostTargets {
	if (platform === "win32") {
		return {
			manifestDir: getStableAtlasPaths({
				env,
				homeDir,
				platform,
			}).nativeManifestDir,
			registryKeys: REGISTRY_PREFIXES[browser].map(
				(prefix) => `${prefix}\\${nativeHostName}`,
			),
		};
	}

	return {
		manifestDir: getUnixManifestDir(browser, platform, homeDir),
		registryKeys: [],
	};
}

function getUnixManifestDir(
	browser: SupportedBrowser,
	platform: Platform,
	homeDir: string,
) {
	const path = getPathApi(platform);
	const entry = MANIFEST_PATHS[browser];
	const segments =
		platform === "darwin"
			? [homeDir, "Library", "Application Support", ...entry.darwin]
			: [homeDir, ...entry.linux];

	return path.join(...segments);
}
