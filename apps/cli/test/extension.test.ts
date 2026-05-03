import {
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
	mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";

import { copyExtensionBuild } from "../src/extension";

test("copies the packaged extension build to the requested output directory", () => {
	const root = mkdtempSync(join(tmpdir(), "atlas-extension-test-"));
	const source = join(root, "source");
	const out = join(root, "out");

	try {
		mkdirSync(source, { recursive: true });
		writeFileSync(join(source, "manifest.json"), '{"manifest_version":3}');

		const result = copyExtensionBuild({
			outPath: out,
			sourcePath: source,
		});

		expect(result.outPath).toBe(out);
		expect(readFileSync(join(out, "manifest.json"), "utf8")).toBe(
			'{"manifest_version":3}',
		);
	} finally {
		rmSync(root, { force: true, recursive: true });
	}
});
