import type { ChromeCallRequest } from "../../packages/chrome-bridge-protocol/protocol";
import { dispatchChromeCall } from "./dispatcher";

const NATIVE_HOST_NAME = "com.qbytes.atlas_chrome_runtime";

let port: chrome.runtime.Port | undefined;

function connectNativeHost() {
	port = chrome.runtime.connectNative(NATIVE_HOST_NAME);

	port.onMessage.addListener(async (message: ChromeCallRequest) => {
		const response = await dispatchChromeCall(chrome as never, message);
		port?.postMessage(response);
	});

	port.onDisconnect.addListener(() => {
		port = undefined;
	});
}

connectNativeHost();
