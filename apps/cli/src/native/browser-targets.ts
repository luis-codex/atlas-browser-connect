import { homedir } from "node:os";

import type { SupportedBrowser } from "../command";
import { nativeHostName } from "./constants";
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
			registryKeys: getWindowsRegistryKeys(browser),
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

	if (platform === "darwin") {
		const applicationSupport = path.join(
			homeDir,
			"Library",
			"Application Support",
		);

		switch (browser) {
			case "chrome":
				return path.join(
					applicationSupport,
					"Google",
					"Chrome",
					"NativeMessagingHosts",
				);
			case "edge":
				return path.join(
					applicationSupport,
					"Microsoft Edge",
					"NativeMessagingHosts",
				);
			case "brave":
				return path.join(
					applicationSupport,
					"BraveSoftware",
					"Brave-Browser",
					"NativeMessagingHosts",
				);
			case "chromium":
				return path.join(
					applicationSupport,
					"Chromium",
					"NativeMessagingHosts",
				);
			case "chrome-for-testing":
				return path.join(
					applicationSupport,
					"Google",
					"Chrome for Testing",
					"NativeMessagingHosts",
				);
		}
	}

	switch (browser) {
		case "chrome":
			return path.join(
				homeDir,
				".config",
				"google-chrome",
				"NativeMessagingHosts",
			);
		case "edge":
			return path.join(
				homeDir,
				".config",
				"microsoft-edge",
				"NativeMessagingHosts",
			);
		case "brave":
			return path.join(
				homeDir,
				".config",
				"BraveSoftware",
				"Brave-Browser",
				"NativeMessagingHosts",
			);
		case "chromium":
			return path.join(homeDir, ".config", "chromium", "NativeMessagingHosts");
		case "chrome-for-testing":
			return path.join(
				homeDir,
				".config",
				"google-chrome-for-testing",
				"NativeMessagingHosts",
			);
	}
}

function getWindowsRegistryKeys(browser: SupportedBrowser) {
	switch (browser) {
		case "chrome":
			return [
				`HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${nativeHostName}`,
				`HKCU\\Software\\WOW6432Node\\Google\\Chrome\\NativeMessagingHosts\\${nativeHostName}`,
			];
		case "edge":
			return [
				`HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts\\${nativeHostName}`,
				`HKCU\\Software\\WOW6432Node\\Microsoft\\Edge\\NativeMessagingHosts\\${nativeHostName}`,
			];
		case "brave":
			return [
				`HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\${nativeHostName}`,
				`HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\${nativeHostName}`,
				`HKCU\\Software\\BraveSoftware\\Brave\\NativeMessagingHosts\\${nativeHostName}`,
				`HKCU\\Software\\WOW6432Node\\BraveSoftware\\Brave\\NativeMessagingHosts\\${nativeHostName}`,
			];
		case "chromium":
			return [
				`HKCU\\Software\\Chromium\\NativeMessagingHosts\\${nativeHostName}`,
				`HKCU\\Software\\WOW6432Node\\Chromium\\NativeMessagingHosts\\${nativeHostName}`,
			];
		case "chrome-for-testing":
			return [
				`HKCU\\Software\\Google\\Chrome for Testing\\NativeMessagingHosts\\${nativeHostName}`,
				`HKCU\\Software\\WOW6432Node\\Google\\Chrome for Testing\\NativeMessagingHosts\\${nativeHostName}`,
			];
	}
}
