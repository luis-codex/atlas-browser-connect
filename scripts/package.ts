import { chmodSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

type PackagePlatform = NodeJS.Platform;

const packageRoot = "release";
const packageName = getReleasePackageName();
const packageDir = join(packageRoot, packageName);

export function getReleasePackageName(
	platform: PackagePlatform = process.platform,
	arch = process.arch,
) {
	return `atlas-browser-connect-${getPlatformName(platform)}-${arch}`;
}

export function getArchiveName(
	releasePackageName = getReleasePackageName(),
	platform: PackagePlatform = process.platform,
) {
	if (platform === "win32") {
		return `${releasePackageName}.zip`;
	}

	return `${releasePackageName}.tar.gz`;
}

export function getPackageEntries() {
	return [
		"dist",
		"scripts/native-host-common.sh",
		"scripts/register-native-host.sh",
		"scripts/unregister-native-host.sh",
		"README.md",
		"LICENSE",
		"package.json",
	];
}

export function getExecutableScriptEntries() {
	return [
		"scripts/native-host-common.sh",
		"scripts/register-native-host.sh",
		"scripts/unregister-native-host.sh",
	];
}

export function getPackageEntryDestination(
	releasePackageName: string,
	entry: string,
) {
	return join(packageRoot, releasePackageName, entry).replaceAll("\\", "/");
}

function getPlatformName(platform: PackagePlatform) {
	switch (platform) {
		case "win32":
			return "windows";
		case "darwin":
			return "macos";
		case "linux":
			return "linux";
		default:
			return platform;
	}
}

function ensurePackageInputs() {
	for (const entry of getPackageEntries()) {
		if (!existsSync(entry)) {
			throw new Error(`Package input is missing: ${entry}`);
		}
	}
}

function copyPackageEntries() {
	rmSync(packageRoot, { force: true, recursive: true });
	mkdirSync(packageDir, { recursive: true });

	for (const entry of getPackageEntries()) {
		const destination = getPackageEntryDestination(packageName, entry);
		mkdirSync(dirname(destination), { recursive: true });
		cpSync(entry, destination, { recursive: true });
	}

	if (process.platform !== "win32") {
		for (const script of getExecutableScriptEntries()) {
			chmodSync(getPackageEntryDestination(packageName, script), 0o755);
		}
	}
}

function createArchive() {
	const archiveName = getArchiveName(packageName);
	const archivePath = join(packageRoot, archiveName);

	if (process.platform === "win32") {
		const result = spawnSync(
			"powershell.exe",
			[
				"-NoProfile",
				"-Command",
				`Compress-Archive -Path '${packageDir}\\*' -DestinationPath '${archivePath}' -Force`,
			],
			{ stdio: "inherit" },
		);

		if (result.status !== 0) {
			process.exit(result.status ?? 1);
		}

		return archivePath;
	}

	const result = spawnSync(
		"tar",
		["-czf", archiveName, "-C", packageName, "."],
		{ cwd: packageRoot, stdio: "inherit" },
	);

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	return archivePath;
}

function main() {
	ensurePackageInputs();
	copyPackageEntries();
	const archivePath = createArchive();
	console.log(`Created ${archivePath}`);
}

if (import.meta.main) {
	main();
}
