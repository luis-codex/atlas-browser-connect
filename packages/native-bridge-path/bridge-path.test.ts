import { expect, test } from "bun:test";

import { getNativeBridgePath } from "./bridge-path";

test("uses a Windows named pipe on Windows", () => {
	expect(getNativeBridgePath("win32")).toBe(
		"\\\\.\\pipe\\atlas-browser-connect",
	);
});

test("uses a Unix socket path outside the repository on Linux and macOS", () => {
	expect(getNativeBridgePath("linux")).toBe("/tmp/atlas-browser-connect.sock");
	expect(getNativeBridgePath("darwin")).toBe("/tmp/atlas-browser-connect.sock");
});
