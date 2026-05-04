import { cpSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { generateManifest } from "../extension/manifest";
import { getStableAtlasPaths } from "./native/paths";

type CopyExtensionBuildOptions = {
	outPath?: string;
	sourcePath: string;
	permissions?: string[];
};

export function copyExtensionBuild({
	outPath = getStableAtlasPaths().extensionDir,
	sourcePath,
	permissions,
}: CopyExtensionBuildOptions) {
	if (!existsSync(sourcePath)) {
		throw new Error(`Extension build not found: ${sourcePath}`);
	}

	rmSync(outPath, { force: true, recursive: true });
	cpSync(sourcePath, outPath, { recursive: true });

	const manifest = generateManifest(permissions);
	writeFileSync(
		join(outPath, "manifest.json"),
		JSON.stringify(manifest, null, "\t"),
	);

	return { outPath };
}
