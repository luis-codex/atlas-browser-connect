import {
	chmodSync,
	copyFileSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";

const cliOutput = "./dist/cli/index.js";

rmSync("./dist/chrome-extension", { force: true, recursive: true });
rmSync("./dist/cli", { force: true, recursive: true });
rmSync("./dist/mcp", { force: true, recursive: true });
rmSync("./dist/native-messaging-host", { force: true, recursive: true });
mkdirSync("./dist/chrome-extension", { recursive: true });

const builds = [
	Bun.build({
		entrypoints: ["./apps/chrome-extension/src/background.ts"],
		outdir: "./dist/chrome-extension",
		format: "esm",
		minify: true,
	}),
	Bun.build({
		entrypoints: ["./apps/mcp-server/src/index.ts"],
		outdir: "./dist/mcp",
		format: "esm",
		target: "node",
	}),
	Bun.build({
		entrypoints: ["./apps/native-messaging-host/src/index.ts"],
		outdir: "./dist/native-messaging-host",
		format: "esm",
		target: "node",
	}),
	Bun.build({
		entrypoints: ["./apps/cli/src/index.ts"],
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

copyFileSync(
	"./apps/chrome-extension/manifest.json",
	"./dist/chrome-extension/manifest.json",
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
