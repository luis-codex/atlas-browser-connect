import net from "node:net";
import process from "node:process";

import type {
	ChromeCallRequest,
	ChromeCallResponse,
} from "../../packages/chrome-bridge-protocol/protocol";
import {
	decodeNativeMessageFrame,
	encodeNativeMessageFrame,
} from "./native-messaging";
import { ChromeRequestRouter } from "./router";

const PIPE_PATH = "\\\\.\\pipe\\atlas-browser-connect";

const router = new ChromeRequestRouter((message) => {
	process.stdout.write(encodeNativeMessageFrame(message));
});

let nativeBuffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
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

server.listen(PIPE_PATH);
