import net from "node:net";
import type { Readable, Writable } from "node:stream";

import type {
	ChromeCallRequest,
	ChromeCallResponse,
} from "../../../../packages/chrome-bridge-protocol/protocol";
import { getNativeBridgePath } from "../../../../packages/native-bridge-path/bridge-path";
import {
	decodeNativeMessageFrame,
	encodeNativeMessageFrame,
} from "../transport/native-messaging";
import { ChromeRequestRouter } from "../router/router";

type NativeMessagingHostOptions = {
	input: Readable;
	output: Writable;
	pipePath?: string;
	requestTimeoutMs?: number;
};

type NativeMessagingHost = {
	closed: Promise<void>;
	ready: Promise<void>;
	server: net.Server;
};

export function startNativeMessagingHost({
	input,
	output,
	pipePath = getNativeBridgePath(),
	requestTimeoutMs,
}: NativeMessagingHostOptions): NativeMessagingHost {
	const router = new ChromeRequestRouter(
		(message) => {
			output.write(encodeNativeMessageFrame(message));
		},
		{ requestTimeoutMs },
	);

	let nativeBuffer = Buffer.alloc(0);

	input.on("data", (chunk) => {
		const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		nativeBuffer = Buffer.concat([nativeBuffer, bufferChunk]);

		while (nativeBuffer.byteLength >= 4) {
			const bodyLength = nativeBuffer.readUInt32LE(0);
			const frameLength = 4 + bodyLength;

			if (nativeBuffer.byteLength < frameLength) {
				return;
			}

			const frame = nativeBuffer.subarray(0, frameLength);
			nativeBuffer = nativeBuffer.subarray(frameLength);
			router.handleChromeMessage(
				decodeNativeMessageFrame(frame) as ChromeCallResponse,
			);
		}
	});

	const server = net.createServer((socket) => {
		let socketBuffer = "";

		socket.on("data", async (chunk) => {
			socketBuffer += chunk.toString("utf8");
			const newlineIndex = socketBuffer.indexOf("\n");

			if (newlineIndex === -1) {
				return;
			}

			const line = socketBuffer.slice(0, newlineIndex);
			socketBuffer = socketBuffer.slice(newlineIndex + 1);
			const request = JSON.parse(line) as ChromeCallRequest;
			const response = await router.routeRequest(request);

			socket.write(`${JSON.stringify(response)}\n`);
			socket.end();
		});
	});

	const ready = new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(pipePath, resolve);
	});

	const closed = new Promise<void>((resolve) => {
		server.once("close", resolve);
	});

	input.once("end", () => {
		server.close();
	});

	return { closed, ready, server };
}
