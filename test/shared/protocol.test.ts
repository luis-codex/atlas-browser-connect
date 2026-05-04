import { expect, test } from "bun:test";

import { createChromeCallRequest } from "../../src/shared/protocol";

test("creates a chrome.call request for tabs.query", () => {
	const request = createChromeCallRequest({
		args: [{ active: true, currentWindow: true }],
		method: "query",
		namespace: "tabs",
	});

	expect(request).toEqual({
		args: [{ active: true, currentWindow: true }],
		id: expect.any(String),
		method: "query",
		namespace: "tabs",
		type: "chrome.call",
	});
});

test("rejects unsafe chrome.call names", () => {
	expect(() =>
		createChromeCallRequest({
			args: [],
			method: "__proto__",
			namespace: "tabs",
		}),
	).toThrow("Invalid Chrome API method");
});
