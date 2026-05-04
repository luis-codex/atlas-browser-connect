import { homedir } from "node:os";
import { posix, win32 } from "node:path";

export const nativeHostName = "com.qbytes.atlas_chrome_runtime";
export const nativeHostDescription =
	"Atlas Browser Connect native messaging host";
export const nativeHostManifestFile = `${nativeHostName}.json`;

export type Platform = NodeJS.Platform;
export type Environment = Record<string, string | undefined>;

type PathOptions = {
	env?: Environment;
	homeDir?: string;
	platform?: Platform;
};

type StableAtlasPaths = {
	appDataDir: string;
	extensionDir: string;
	nativeHostDir: string;
	nativeHostEntryPath: string;
	nativeHostLauncherPath: string;
	nativeManifestDir: string;
	nativeManifestPath: string;
};

export function getStableAtlasPaths({
	env = process.env,
	homeDir = homedir(),
	platform = process.platform,
}: PathOptions = {}): StableAtlasPaths {
	const path = getPathApi(platform);
	const baseDir = getPlatformDataDir(platform, homeDir, env);
	const appDataDir = path.join(baseDir, "atlas-browser-connect");
	const nativeHostDir = path.join(appDataDir, "native-host");
	const nativeManifestDir = path.join(appDataDir, "NativeMessagingHosts");
	const nativeHostLauncherPath = path.join(
		nativeHostDir,
		platform === "win32"
			? "atlas-native-messaging-host.bat"
			: "atlas-native-messaging-host",
	);

	return {
		appDataDir,
		extensionDir: path.join(appDataDir, "chrome-extension"),
		nativeHostDir,
		nativeHostEntryPath: path.join(nativeHostDir, "index.mjs"),
		nativeHostLauncherPath,
		nativeManifestDir,
		nativeManifestPath: path.join(nativeManifestDir, nativeHostManifestFile),
	};
}

export function getPathApi(platform: Platform) {
	return platform === "win32" ? win32 : posix;
}

function getPlatformDataDir(
	platform: Platform,
	homeDir: string,
	env: Environment,
) {
	const path = getPathApi(platform);

	if (platform === "win32") {
		return env.LOCALAPPDATA ?? path.join(homeDir, "AppData", "Local");
	}

	if (platform === "darwin") {
		return path.join(homeDir, "Library", "Application Support");
	}

	return env.XDG_DATA_HOME ?? path.join(homeDir, ".local", "share");
}
