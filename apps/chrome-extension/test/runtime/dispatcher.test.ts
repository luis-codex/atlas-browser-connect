import { expect, test } from "bun:test";

import { dispatchChromeCall } from "../../src/runtime/dispatcher";

test("dispatches tabs.query against the Chrome runtime API", async () => {
	const chromeApi = {
		tabs: {
			query: async (queryInfo: unknown) => [{ id: 7, active: true, queryInfo }],
		},
	};

	const response = await dispatchChromeCall(chromeApi, {
		args: [{ active: true, currentWindow: true }],
		id: "req_1",
		method: "query",
		namespace: "tabs",
		type: "chrome.call",
	});

	expect(response).toEqual({
		id: "req_1",
		ok: true,
		result: [
			{
				active: true,
				id: 7,
				queryInfo: { active: true, currentWindow: true },
			},
		],
	});
});

test("returns a protocol error when the Chrome method is unavailable", async () => {
	const response = await dispatchChromeCall(
		{ tabs: {} },
		{
			args: [],
			id: "req_2",
			method: "query",
			namespace: "tabs",
			type: "chrome.call",
		},
	);

	expect(response).toEqual({
		error: { message: "Chrome API method not available: tabs.query" },
		id: "req_2",
		ok: false,
	});
});
