import { expect, test } from "bun:test";

import { parseCommand } from "../../src/cli/commands";

test("parses extension build with optional output directory and permissions", () => {
	expect(parseCommand(["extension", "build"])).toEqual({
		kind: "extension-build",
		outPath: undefined,
		permissions: undefined,
	});
	expect(
		parseCommand(["extension", "build", "--out", "C:\\temp\\ext"]),
	).toEqual({
		kind: "extension-build",
		outPath: "C:\\temp\\ext",
		permissions: undefined,
	});
	expect(
		parseCommand([
			"extension",
			"build",
			"--permissions",
			"tabs,scripting,debugger",
		]),
	).toEqual({
		kind: "extension-build",
		outPath: undefined,
		permissions: ["tabs", "scripting", "debugger"],
	});
	expect(
		parseCommand([
			"extension",
			"build",
			"--out=C:\\temp\\ext",
			"--permissions=scripting",
		]),
	).toEqual({
		kind: "extension-build",
		outPath: "C:\\temp\\ext",
		permissions: ["scripting"],
	});
	// PowerShell .ps1 npm shims convert comma-separated values to
	// space-separated strings when forwarding $args to node.
	expect(
		parseCommand([
			"extension",
			"build",
			"--permissions",
			"tabs scripting debugger",
		]),
	).toEqual({
		kind: "extension-build",
		outPath: undefined,
		permissions: ["tabs", "scripting", "debugger"],
	});
});

test("parses native register with explicit extension id and browser", () => {
	expect(
		parseCommand([
			"native",
			"register",
			"--extension-id",
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			"--browser",
			"chrome",
		]),
	).toEqual({
		browser: "chrome",
		extensionId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		kind: "native-register",
	});
	expect(
		parseCommand([
			"native",
			"register",
			"--extension-id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			"--browser=chrome",
		]),
	).toEqual({
		browser: "chrome",
		extensionId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		kind: "native-register",
	});
});

test("native register requires an extension id and browser", () => {
	expect(() =>
		parseCommand(["native", "register", "--browser", "chrome"]),
	).toThrow("native register requires --extension-id");
	expect(() =>
		parseCommand([
			"native",
			"register",
			"--extension-id",
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		]),
	).toThrow("native register requires --browser");
});

test("parses native unregister and mcp without extension-specific settings", () => {
	expect(parseCommand(["native", "unregister", "--browser", "all"])).toEqual({
		browser: "all",
		kind: "native-unregister",
	});
	expect(parseCommand(["mcp"])).toEqual({ kind: "mcp" });
});

test("rejects unknown options instead of ignoring them", () => {
	expect(() =>
		parseCommand(["extension", "build", "--unknown", "value"]),
	).toThrow("unknown option");
});
