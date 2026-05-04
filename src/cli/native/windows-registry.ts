import { spawnSync } from "node:child_process";

export function setWindowsRegistryValueWithPowerShell(
	registryKey: string,
	value: string,
) {
	const result = spawnSync(
		"powershell.exe",
		[
			"-NoProfile",
			"-Command",
			`& { param($key,$value) New-Item -Path ('Registry::' + $key) -Force | Out-Null; Set-Item -Path ('Registry::' + $key) -Value $value }`,
			registryKey,
			value,
		],
		{ stdio: "inherit" },
	);

	if (result.status !== 0) {
		throw new Error(`Failed to write Windows registry key: ${registryKey}`);
	}
}

export function removeWindowsRegistryKeyWithPowerShell(registryKey: string) {
	const result = spawnSync(
		"powershell.exe",
		[
			"-NoProfile",
			"-Command",
			`& { param($key) if (Test-Path -LiteralPath ('Registry::' + $key)) { Remove-Item -LiteralPath ('Registry::' + $key) -Force -Recurse } }`,
			registryKey,
		],
		{ stdio: "inherit" },
	);

	if (result.status !== 0) {
		throw new Error(`Failed to remove Windows registry key: ${registryKey}`);
	}
}
