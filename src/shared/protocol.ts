export type ChromeCallInput = {
	namespace: string;
	method: string;
	args?: unknown[];
};

export type ChromeCallRequest = {
	id: string;
	type: "chrome.call";
	namespace: string;
	method: string;
	args: unknown[];
};

export type ChromeCallResponse =
	| {
			id: string;
			ok: true;
			result: unknown;
	  }
	| {
			id: string;
			ok: false;
			error: {
				message: string;
			};
	  };

const SAFE_CHROME_NAME = /^[A-Za-z][A-Za-z0-9]*$/;

export function createChromeCallRequest(
	input: ChromeCallInput,
): ChromeCallRequest {
	validateChromeName(input.namespace, "namespace");
	validateChromeName(input.method, "method");

	return {
		args: input.args ?? [],
		id: crypto.randomUUID(),
		method: input.method,
		namespace: input.namespace,
		type: "chrome.call",
	};
}

function validateChromeName(value: string, label: "method" | "namespace") {
	if (!SAFE_CHROME_NAME.test(value)) {
		throw new Error(`Invalid Chrome API ${label}`);
	}
}
