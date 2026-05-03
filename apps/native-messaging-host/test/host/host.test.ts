import net from "node:net";
import { PassThrough } from "node:stream";
import { expect, test } from "bun:test";

import { startNativeMessagingHost } from "../../src/host/host";

const pipePath =
	process.platform === "win32"
		? `\\\\.\\pipe\\atlas-browser-connect-test-${crypto.randomUUID()}`
		: `/tmp/atlas-browser-connect-test-${crypto.randomUUID()}.sock`;

test("closes the MCP pipe when Chrome closes the native messaging input", async () => {
	const input = new PassThrough();
	const output = new PassThrough();
	const host = startNativeMessagingHost({ input, output, pipePath });

	await host.ready;
	input.end();
	await host.closed;

	const server = net.createServer();
	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(pipePath, resolve);
	});

	expect(server.listening).toBe(true);

	await new Promise<void>((resolve) => server.close(() => resolve()));
});
