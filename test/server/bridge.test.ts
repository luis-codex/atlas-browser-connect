import net from "node:net";
import { expect, test } from "bun:test";

import { sendChromeCall } from "../../src/server/bridge";

test("returns error response on malformed JSON from native host", async () => {
	const pipePath =
		process.platform === "win32"
			? `\\\\.\\pipe\\atlas-bridge-test-${crypto.randomUUID()}`
			: `/tmp/atlas-bridge-test-${crypto.randomUUID()}.sock`;

	// Start a mock server that replies with broken JSON
	const server = net.createServer((socket) => {
		socket.on("data", () => {
			socket.write("{not valid json\n");
			socket.end();
		});
	});

	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(pipePath, resolve);
	});

	const response = await sendChromeCall(
		{
			args: [],
			id: "req_malformed",
			method: "query",
			namespace: "tabs",
			type: "chrome.call",
		},
		pipePath,
	);

	expect(response.ok).toBe(false);
	if (!response.ok) {
		expect(response.error.message).toBe("Malformed response from native host");
	}

	await new Promise<void>((resolve) => server.close(() => resolve()));
});
