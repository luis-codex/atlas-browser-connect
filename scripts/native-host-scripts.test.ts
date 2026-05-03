import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { expect, test } from "bun:test";

const registerScript = readFileSync("scripts/register-native-host.sh", "utf8");
const commonScript = readFileSync("scripts/native-host-common.sh", "utf8");

test("register and unregister scripts share native host configuration", () => {
	const unregisterScript = readFileSync(
		"scripts/unregister-native-host.sh",
		"utf8",
	);

	expect(registerScript).toContain(
		'source "$SCRIPT_DIR/native-host-common.sh"',
	);
	expect(unregisterScript).toContain(
		'source "$SCRIPT_DIR/native-host-common.sh"',
	);
	expect(commonScript).toContain('HOST_NAME="com.qbytes.atlas_chrome_runtime"');
	expect(commonScript).toContain("atlas-browser-connect/NativeMessagingHosts");
	expect(commonScript).not.toContain(
		'MANIFEST_PATH="$ROOT_DIR/dist/native-messaging-host/$HOST_NAME.json"',
	);
});

test("unregister script removes browser registration and manifest", () => {
	const unregisterScript = readFileSync(
		"scripts/unregister-native-host.sh",
		"utf8",
	);

	expect(commonScript).toContain("remove_windows_registry_key");
	expect(commonScript).toContain("Remove-Item -LiteralPath");
	expect(commonScript).toContain("remove_native_host_manifest");
	expect(unregisterScript).toContain("native_host_unregister");
});

test("native host shell scripts are valid bash", () => {
	const bash = findBash();

	if (!bash) {
		return;
	}

	for (const scriptPath of [
		"scripts/native-host-common.sh",
		"scripts/register-native-host.sh",
		"scripts/unregister-native-host.sh",
	]) {
		const result = spawnSync(bash, ["-n", scriptPath], {
			encoding: "utf8",
		});

		expect(result.stderr).toBe("");
		expect(result.status).toBe(0);
	}
});

function findBash() {
	for (const candidate of [
		process.env.BASH,
		"bash",
		"C:\\Program Files\\Git\\bin\\bash.exe",
		"C:\\Program Files\\Git\\usr\\bin\\bash.exe",
	]) {
		if (!candidate) {
			continue;
		}

		if (candidate.includes("\\") && !existsSync(candidate)) {
			continue;
		}

		const result = spawnSync(candidate, ["--version"], {
			encoding: "utf8",
		});

		if (result.status === 0) {
			return candidate;
		}
	}
}
