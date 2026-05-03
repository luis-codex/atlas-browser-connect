import { expect, test } from "bun:test";

import { parseCommand } from "../src/command";

test("parses extension build with an optional output directory", () => {
	expect(parseCommand(["extension", "build"])).toEqual({
		kind: "extension-build",
		outPath: undefined,
	});
	expect(
		parseCommand(["extension", "build", "--out", "C:\\temp\\ext"]),
	).toEqual({
		kind: "extension-build",
		outPath: "C:\\temp\\ext",
	});
	expect(parseCommand(["extension", "build", "--out=C:\\temp\\ext"])).toEqual({
		kind: "extension-build",
		outPath: "C:\\temp\\ext",
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
