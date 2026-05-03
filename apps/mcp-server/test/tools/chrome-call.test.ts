import { expect, test } from "bun:test";

import { runChromeCallTool } from "../../src/tools/chrome-call";

test("chrome_call forwards tabs.query to the bridge", async () => {
	const calls: unknown[] = [];

	const result = await runChromeCallTool(
		{
			args: [{ active: true, currentWindow: true }],
			method: "query",
			namespace: "tabs",
		},
		async (request) => {
			calls.push(request);

			return {
				id: request.id,
				ok: true,
				result: [{ id: 1, active: true }],
			};
		},
	);

	expect(calls).toEqual([
		{
			args: [{ active: true, currentWindow: true }],
			id: expect.any(String),
			method: "query",
			namespace: "tabs",
			type: "chrome.call",
		},
	]);
	expect(result).toEqual({
		content: [
			{
				text: JSON.stringify([{ id: 1, active: true }], null, 2),
				type: "text",
			},
		],
	});
});

test("chrome_call returns bridge errors as tool text", async () => {
	const result = await runChromeCallTool(
		{
			args: [],
			method: "query",
			namespace: "tabs",
		},
		async (request) => ({
			error: { message: "Chrome extension is not connected" },
			id: request.id,
			ok: false,
		}),
	);

	expect(result).toEqual({
		content: [
			{
				text: "Chrome extension is not connected",
				type: "text",
			},
		],
		isError: true,
	});
});
