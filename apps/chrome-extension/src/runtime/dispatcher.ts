import type {
	ChromeCallRequest,
	ChromeCallResponse,
} from "../../../../packages/chrome-bridge-protocol/protocol";

type ChromeApi = Record<string, Record<string, unknown>>;

export async function dispatchChromeCall(
	chromeApi: ChromeApi,
	request: ChromeCallRequest,
): Promise<ChromeCallResponse> {
	const namespaceApi = chromeApi[request.namespace];
	const method = namespaceApi?.[request.method];

	if (typeof method !== "function") {
		return {
			error: {
				message: `Chrome API method not available: ${request.namespace}.${request.method}`,
			},
			id: request.id,
			ok: false,
		};
	}

	try {
		const result = await method.apply(namespaceApi, request.args);

		return {
			id: request.id,
			ok: true,
			result,
		};
	} catch (error) {
		return {
			error: {
				message: error instanceof Error ? error.message : String(error),
			},
			id: request.id,
			ok: false,
		};
	}
}
