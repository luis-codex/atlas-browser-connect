import { expect, test } from "bun:test";

import { ChromeRequestRouter } from "../../src/host/router";

test("routes a pipe request to Chrome and resolves with Chrome response", async () => {
	const sentToChrome: unknown[] = [];
	const router = new ChromeRequestRouter((message) =>
		sentToChrome.push(message),
	);

	const responsePromise = router.routeRequest({
		args: [{ active: true }],
		id: "req_1",
		method: "query",
		namespace: "tabs",
		type: "chrome.call",
	});

	expect(sentToChrome).toEqual([
		{
			args: [{ active: true }],
			id: "req_1",
			method: "query",
			namespace: "tabs",
			type: "chrome.call",
		},
	]);

	router.handleChromeMessage({
		id: "req_1",
		ok: true,
		result: [{ id: 1 }],
	});

	await expect(responsePromise).resolves.toEqual({
		id: "req_1",
		ok: true,
		result: [{ id: 1 }],
	});
});

test("resolves a pending pipe request when Chrome does not answer", async () => {
	const router = new ChromeRequestRouter(() => {}, {
		requestTimeoutMs: 1,
	});

	await expect(
		router.routeRequest({
			args: [],
			id: "req_timeout",
			method: "query",
			namespace: "tabs",
			type: "chrome.call",
		}),
	).resolves.toEqual({
		error: { message: "Chrome extension did not answer in time" },
		id: "req_timeout",
		ok: false,
	});
});
