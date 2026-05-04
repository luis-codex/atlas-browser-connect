import { expect, test } from "bun:test";

import { generateManifest } from "../../src/extension/manifest";

test("generates manifest with default permissions when none specified", () => {
	const manifest = generateManifest();
	expect(manifest.manifest_version).toBe(3);
	expect(manifest.permissions).toContain("nativeMessaging");
	expect(manifest.permissions).toContain("tabs");
	expect(manifest.permissions).toContain("bookmarks");
});

test("always includes nativeMessaging even with custom permissions", () => {
	const manifest = generateManifest(["scripting", "debugger"]);
	expect(manifest.permissions).toContain("nativeMessaging");
	expect(manifest.permissions).toContain("scripting");
	expect(manifest.permissions).toContain("debugger");
	expect(manifest.permissions).not.toContain("tabs");
});

test("deduplicates permissions", () => {
	const manifest = generateManifest(["tabs", "tabs", "nativeMessaging"]);
	const tabsCount = manifest.permissions.filter((p) => p === "tabs").length;
	expect(tabsCount).toBe(1);
});
