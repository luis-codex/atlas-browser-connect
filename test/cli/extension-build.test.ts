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

import { copyExtensionBuild } from "../../src/cli/extension-build";

test("copies extension build and generates manifest with default permissions", () => {
	const root = mkdtempSync(join(tmpdir(), "atlas-extension-test-"));
	const source = join(root, "source");
	const out = join(root, "out");

	try {
		mkdirSync(source, { recursive: true });
		writeFileSync(join(source, "background.js"), "// background");

		const result = copyExtensionBuild({ outPath: out, sourcePath: source });

		expect(result.outPath).toBe(out);
		expect(existsSync(join(out, "background.js"))).toBe(true);

		const manifest = JSON.parse(
			readFileSync(join(out, "manifest.json"), "utf8"),
		);
		expect(manifest.manifest_version).toBe(3);
		expect(manifest.permissions).toContain("nativeMessaging");
		expect(manifest.permissions).toContain("tabs");
	} finally {
		rmSync(root, { force: true, recursive: true });
	}
});

test("generates manifest with custom permissions when specified", () => {
	const root = mkdtempSync(join(tmpdir(), "atlas-extension-test-"));
	const source = join(root, "source");
	const out = join(root, "out");

	try {
		mkdirSync(source, { recursive: true });
		writeFileSync(join(source, "background.js"), "// background");

		copyExtensionBuild({
			outPath: out,
			sourcePath: source,
			permissions: ["scripting", "debugger"],
		});

		const manifest = JSON.parse(
			readFileSync(join(out, "manifest.json"), "utf8"),
		);
		expect(manifest.permissions).toContain("nativeMessaging");
		expect(manifest.permissions).toContain("scripting");
		expect(manifest.permissions).toContain("debugger");
		expect(manifest.permissions).not.toContain("tabs");
	} finally {
		rmSync(root, { force: true, recursive: true });
	}
});
