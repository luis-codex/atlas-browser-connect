export function encodeNativeMessageFrame(message: unknown): Buffer {
	const body = Buffer.from(JSON.stringify(message), "utf8");
	const frame = Buffer.allocUnsafe(4 + body.byteLength);

	frame.writeUInt32LE(body.byteLength, 0);
	body.copy(frame, 4);

	return frame;
}

export function decodeNativeMessageFrame(frame: Buffer): unknown {
	if (frame.byteLength < 4) {
		throw new Error("Incomplete native messaging frame");
	}

	const bodyLength = frame.readUInt32LE(0);
	const expectedLength = 4 + bodyLength;

	if (frame.byteLength < expectedLength) {
		throw new Error("Incomplete native messaging frame");
	}

	return JSON.parse(frame.subarray(4, expectedLength).toString("utf8"));
}
