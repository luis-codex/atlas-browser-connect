import { copyFileSync, mkdirSync, rmSync } from "node:fs";

const nativeHostOutput =
	process.platform === "win32"
		? "./dist/native-messaging-host/atlas-native-messaging-host.exe"
		: "./dist/native-messaging-host/atlas-native-messaging-host";

rmSync("./dist/chrome-extension", { force: true, recursive: true });
rmSync("./dist/mcp", { force: true, recursive: true });
rmSync("./dist/native-messaging-host", { force: true, recursive: true });
mkdirSync("./dist/chrome-extension", { recursive: true });
mkdirSync("./dist/native-messaging-host", { recursive: true });

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
];

const compileNativeHost = Bun.spawn([
	"bun",
	"build",
	"./apps/native-messaging-host/src/index.ts",
	"--compile",
	"--outfile",
	nativeHostOutput,
]);

const results = await Promise.all(builds);
const failedBuild = results.find((result) => !result.success);
const nativeHostExitCode = await compileNativeHost.exited;

if (failedBuild) {
	for (const log of failedBuild.logs) {
		console.error(log);
	}

	process.exit(1);
}

if (nativeHostExitCode !== 0) {
	process.exit(nativeHostExitCode);
}

copyFileSync(
	"./apps/chrome-extension/manifest.json",
	"./dist/chrome-extension/manifest.json",
);
