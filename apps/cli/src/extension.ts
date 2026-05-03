import { cpSync, existsSync, rmSync } from "node:fs";

import { getStableAtlasPaths } from "./native/paths";

type CopyExtensionBuildOptions = {
	outPath?: string;
	sourcePath: string;
};

export function copyExtensionBuild({
	outPath = getStableAtlasPaths().extensionDir,
	sourcePath,
}: CopyExtensionBuildOptions) {
	if (!existsSync(sourcePath)) {
		throw new Error(`Extension build not found: ${sourcePath}`);
	}

	rmSync(outPath, { force: true, recursive: true });
	cpSync(sourcePath, outPath, { recursive: true });

	return { outPath };
}
