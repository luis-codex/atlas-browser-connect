import { expect, test } from "bun:test";

import {
	decodeNativeMessageFrame,
	encodeNativeMessageFrame,
} from "./native-messaging";

test("encodes and decodes a native messaging frame", () => {
	const frame = encodeNativeMessageFrame({
		id: "req_1",
		type: "chrome.call",
		namespace: "tabs",
		method: "query",
		args: [{ active: true }],
	});

	expect(frame.readUInt32LE(0)).toBe(frame.byteLength - 4);
	expect(decodeNativeMessageFrame(frame)).toEqual({
		id: "req_1",
		type: "chrome.call",
		namespace: "tabs",
		method: "query",
		args: [{ active: true }],
	});
});

test("rejects incomplete native messaging frames", () => {
	const frame = encodeNativeMessageFrame({ id: "req_1", type: "ping" });

	expect(() =>
		decodeNativeMessageFrame(frame.subarray(0, frame.byteLength - 1)),
	).toThrow("Incomplete native messaging frame");
});
