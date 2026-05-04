import {
	chmodSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";

import { generateManifest } from "../src/extension/manifest";

const cliOutput = "./dist/cli/index.js";

rmSync("./dist/chrome-extension", { force: true, recursive: true });
rmSync("./dist/cli", { force: true, recursive: true });
rmSync("./dist/mcp", { force: true, recursive: true });
rmSync("./dist/native-messaging-host", { force: true, recursive: true });
mkdirSync("./dist/chrome-extension", { recursive: true });

const builds = [
	Bun.build({
		entrypoints: ["./src/extension/background.ts"],
		outdir: "./dist/chrome-extension",
		format: "esm",
		minify: true,
	}),
	Bun.build({
		entrypoints: ["./src/server/index.ts"],
		outdir: "./dist/mcp",
		format: "esm",
		target: "node",
	}),
	Bun.build({
		entrypoints: ["./src/host/index.ts"],
		outdir: "./dist/native-messaging-host",
		format: "esm",
		target: "node",
	}),
	Bun.build({
		entrypoints: ["./src/cli/index.ts"],
		outdir: "./dist/cli",
		format: "esm",
		target: "node",
	}),
];

const results = await Promise.all(builds);
const failedBuild = results.find((result) => !result.success);

if (failedBuild) {
	for (const log of failedBuild.logs) {
		console.error(log);
	}

	process.exit(1);
}

writeFileSync(
	"./dist/chrome-extension/manifest.json",
	JSON.stringify(generateManifest(), null, "\t"),
);

ensureExecutableCli();

function ensureExecutableCli() {
	const contents = readFileSync(cliOutput, "utf8");

	if (!contents.startsWith("#!/usr/bin/env node")) {
		writeFileSync(cliOutput, `#!/usr/bin/env node\n${contents}`);
	}

	if (process.platform !== "win32") {
		chmodSync(cliOutput, 0o755);
	}
}
