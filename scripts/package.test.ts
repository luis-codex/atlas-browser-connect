import { expect, test } from "bun:test";

import {
	getArchiveName,
	getExecutableScriptEntries,
	getPackageEntries,
	getReleasePackageName,
	getPackageEntryDestination,
} from "./package";

test("names release packages by operating system and architecture", () => {
	expect(getReleasePackageName("win32", "x64")).toBe(
		"atlas-browser-connect-windows-x64",
	);
	expect(getReleasePackageName("linux", "x64")).toBe(
		"atlas-browser-connect-linux-x64",
	);
	expect(getReleasePackageName("darwin", "arm64")).toBe(
		"atlas-browser-connect-macos-arm64",
	);
	expect(getReleasePackageName("darwin", "x64")).toBe(
		"atlas-browser-connect-macos-x64",
	);
});

test("uses zip on Windows and tar.gz elsewhere", () => {
	expect(getArchiveName("atlas-browser-connect-windows-x64", "win32")).toBe(
		"atlas-browser-connect-windows-x64.zip",
	);
	expect(getArchiveName("atlas-browser-connect-linux-x64", "linux")).toBe(
		"atlas-browser-connect-linux-x64.tar.gz",
	);
});

test("packages only runtime assets and install scripts", () => {
	expect(getPackageEntries()).toEqual([
		"dist",
		"scripts/native-host-common.sh",
		"scripts/register-native-host.sh",
		"scripts/unregister-native-host.sh",
		"README.md",
		"LICENSE",
		"package.json",
	]);
});

test("preserves package entry paths inside the archive directory", () => {
	expect(
		getPackageEntryDestination("atlas-browser-connect-windows-x64", "dist"),
	).toBe("release/atlas-browser-connect-windows-x64/dist");
	expect(
		getPackageEntryDestination(
			"atlas-browser-connect-windows-x64",
			"scripts/register-native-host.sh",
		),
	).toBe(
		"release/atlas-browser-connect-windows-x64/scripts/register-native-host.sh",
	);
});

test("marks install scripts as executable in Unix packages", () => {
	expect(getExecutableScriptEntries()).toEqual([
		"scripts/native-host-common.sh",
		"scripts/register-native-host.sh",
		"scripts/unregister-native-host.sh",
	]);
});
