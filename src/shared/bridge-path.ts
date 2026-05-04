export function getNativeBridgePath(platform = process.platform) {
	if (platform === "win32") {
		return "\\\\.\\pipe\\atlas-browser-connect";
	}

	return "/tmp/atlas-browser-connect.sock";
}
