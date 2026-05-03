import type { ChromeCallRequest } from "../../../packages/chrome-bridge-protocol/protocol";
import { dispatchChromeCall } from "./runtime/dispatcher";

const NATIVE_HOST_NAME = "com.qbytes.atlas_chrome_runtime";

let port: chrome.runtime.Port | undefined;

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
	});
}

connectNativeHost();
