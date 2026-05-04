import net from "node:net";

import type { ChromeCallRequest, ChromeCallResponse } from "../shared/protocol";
import { getNativeBridgePath } from "../shared/bridge-path";

export async function sendChromeCall(
	request: ChromeCallRequest,
	pipePath = getNativeBridgePath(),
): Promise<ChromeCallResponse> {
	return new Promise((resolve) => {
		const client = net.createConnection(pipePath);
		let response = "";

		client.on("connect", () => {
			client.write(`${JSON.stringify(request)}\n`);
		});

		client.on("data", (chunk) => {
			response += chunk.toString("utf8");
			const newlineIndex = response.indexOf("\n");

			if (newlineIndex === -1) {
				return;
			}

			const line = response.slice(0, newlineIndex);
			client.end();
			resolve(JSON.parse(line) as ChromeCallResponse);
		});

		client.on("error", () => {
			resolve({
				error: { message: "Chrome native host is not connected" },
				id: request.id,
				ok: false,
			});
		});
	});
}
