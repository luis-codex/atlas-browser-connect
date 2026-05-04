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
	"chrome-beta": {
		darwin: ["Google", "Chrome Beta", "NativeMessagingHosts"],
		linux: [".config", "google-chrome-beta", "NativeMessagingHosts"],
	},
	"chrome-dev": {
		darwin: ["Google", "Chrome Dev", "NativeMessagingHosts"],
		linux: [".config", "google-chrome-unstable", "NativeMessagingHosts"],
	},
	"chrome-canary": {
		darwin: ["Google", "Chrome Canary", "NativeMessagingHosts"],
		linux: [".config", "google-chrome-canary", "NativeMessagingHosts"],
	},
	"chrome-for-testing": {
		darwin: ["Google", "Chrome for Testing", "NativeMessagingHosts"],
		linux: [".config", "google-chrome-for-testing", "NativeMessagingHosts"],
	},
	edge: {
		darwin: ["Microsoft Edge", "NativeMessagingHosts"],
		linux: [".config", "microsoft-edge", "NativeMessagingHosts"],
	},
	"edge-beta": {
		darwin: ["Microsoft Edge Beta", "NativeMessagingHosts"],
		linux: [".config", "microsoft-edge-beta", "NativeMessagingHosts"],
	},
	"edge-dev": {
		darwin: ["Microsoft Edge Dev", "NativeMessagingHosts"],
		linux: [".config", "microsoft-edge-dev", "NativeMessagingHosts"],
	},
	"edge-canary": {
		darwin: ["Microsoft Edge Canary", "NativeMessagingHosts"],
		linux: [".config", "microsoft-edge-canary", "NativeMessagingHosts"],
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
	"brave-beta": {
		darwin: [
			"BraveSoftware",
			"Brave-Browser-Beta",
			"NativeMessagingHosts",
		],
		linux: [
			".config",
			"BraveSoftware",
			"Brave-Browser-Beta",
			"NativeMessagingHosts",
		],
	},
	"brave-nightly": {
		darwin: [
			"BraveSoftware",
			"Brave-Browser-Nightly",
			"NativeMessagingHosts",
		],
		linux: [
			".config",
			"BraveSoftware",
			"Brave-Browser-Nightly",
			"NativeMessagingHosts",
		],
	},
	chromium: {
		darwin: ["Chromium", "NativeMessagingHosts"],
		linux: [".config", "chromium", "NativeMessagingHosts"],
	},
	vivaldi: {
		darwin: ["Vivaldi", "NativeMessagingHosts"],
		linux: [".config", "vivaldi", "NativeMessagingHosts"],
	},
	opera: {
		darwin: ["com.operasoftware.Opera", "NativeMessagingHosts"],
		linux: [".config", "opera", "NativeMessagingHosts"],
	},
	arc: {
		darwin: ["Arc", "User Data", "NativeMessagingHosts"],
		linux: [".config", "arc", "NativeMessagingHosts"],
	},
};

/**
 * Windows registry key prefixes for each browser's NativeMessagingHosts.
 * The native host name is appended to each prefix at runtime.
 *
 * Most Chromium forks read from their own vendor key + the WOW6432Node
 * counterpart for 32-bit compatibility.
 */
const REGISTRY_PREFIXES: Record<SupportedBrowser, string[]> = {
	chrome: [
		"HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Google\\Chrome\\NativeMessagingHosts",
	],
	"chrome-beta": [
		"HKCU\\Software\\Google\\Chrome Beta\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Google\\Chrome Beta\\NativeMessagingHosts",
	],
	"chrome-dev": [
		"HKCU\\Software\\Google\\Chrome Dev\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Google\\Chrome Dev\\NativeMessagingHosts",
	],
	"chrome-canary": [
		"HKCU\\Software\\Google\\Chrome SxS\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Google\\Chrome SxS\\NativeMessagingHosts",
	],
	"chrome-for-testing": [
		"HKCU\\Software\\Google\\Chrome for Testing\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Google\\Chrome for Testing\\NativeMessagingHosts",
	],
	edge: [
		"HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Microsoft\\Edge\\NativeMessagingHosts",
	],
	"edge-beta": [
		"HKCU\\Software\\Microsoft\\Edge Beta\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Microsoft\\Edge Beta\\NativeMessagingHosts",
	],
	"edge-dev": [
		"HKCU\\Software\\Microsoft\\Edge Dev\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Microsoft\\Edge Dev\\NativeMessagingHosts",
	],
	"edge-canary": [
		"HKCU\\Software\\Microsoft\\Edge SxS\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Microsoft\\Edge SxS\\NativeMessagingHosts",
	],
	brave: [
		"HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts",
		"HKCU\\Software\\BraveSoftware\\Brave\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave\\NativeMessagingHosts",
	],
	"brave-beta": [
		"HKCU\\Software\\BraveSoftware\\Brave-Browser-Beta\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave-Browser-Beta\\NativeMessagingHosts",
	],
	"brave-nightly": [
		"HKCU\\Software\\BraveSoftware\\Brave-Browser-Nightly\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave-Browser-Nightly\\NativeMessagingHosts",
	],
	chromium: [
		"HKCU\\Software\\Chromium\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Chromium\\NativeMessagingHosts",
	],
	vivaldi: [
		"HKCU\\Software\\Vivaldi\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Vivaldi\\NativeMessagingHosts",
	],
	opera: [
		"HKCU\\Software\\Opera Software\\Opera Stable\\NativeMessagingHosts",
		"HKCU\\Software\\WOW6432Node\\Opera Software\\Opera Stable\\NativeMessagingHosts",
	],
	arc: [
		// Arc on Windows reads from the Chrome registry keys
		"HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts",
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
