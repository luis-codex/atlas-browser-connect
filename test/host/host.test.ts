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

test("responds with error instead of crashing on malformed socket JSON", async () => {
	const malformedPipePath =
		process.platform === "win32"
			? `\\\\.\\pipe\\atlas-browser-connect-malformed-${crypto.randomUUID()}`
			: `/tmp/atlas-browser-connect-malformed-${crypto.randomUUID()}.sock`;

	const input = new PassThrough();
	const output = new PassThrough();
	const host = startNativeMessagingHost({
		input,
		output,
		pipePath: malformedPipePath,
	});

	await host.ready;

	const response = await new Promise<string>((resolve) => {
		const client = net.createConnection(malformedPipePath, () => {
			client.write("{not valid json\n");
		});

		let data = "";
		client.on("data", (chunk) => {
			data += chunk.toString("utf8");
			if (data.includes("\n")) {
				client.end();
				resolve(data.trim());
			}
		});
	});

	const parsed = JSON.parse(response);
	expect(parsed.ok).toBe(false);
	expect(parsed.error.message).toBe("Malformed request");

	input.end();
	await host.closed;
});
