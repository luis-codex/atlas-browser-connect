import type { ChromeCallRequest, ChromeCallResponse } from "../shared/protocol";

const NATIVE_HOST_NAME = "com.qbytes.atlas_chrome_runtime";
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

type ChromeApi = Record<string, Record<string, unknown>>;

// --- Dispatcher ---

async function dispatchChromeCall(
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

// --- Native Messaging ---

let port: chrome.runtime.Port | undefined;
let reconnectDelay = RECONNECT_BASE_MS;

function connectNativeHost() {
	port = chrome.runtime.connectNative(NATIVE_HOST_NAME);

	port.onMessage.addListener(async (message: ChromeCallRequest) => {
		const response = await dispatchChromeCall(chrome as never, message);
		port?.postMessage(response);
	});

	port.onDisconnect.addListener(() => {
		const errorMessage = chrome.runtime.lastError?.message;

		if (errorMessage) {
			console.warn(`Native Messaging host disconnected: ${errorMessage}`);
		}

		port = undefined;
		scheduleReconnect();
	});

	// Reset backoff on successful connection
	reconnectDelay = RECONNECT_BASE_MS;
}

function scheduleReconnect() {
	setTimeout(() => {
		connectNativeHost();
	}, reconnectDelay);
	reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
}

// Only connect in the actual extension runtime (not during tests)
if (typeof globalThis.chrome !== "undefined") {
	connectNativeHost();
}

export { dispatchChromeCall };
