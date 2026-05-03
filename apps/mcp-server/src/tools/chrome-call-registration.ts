import type {
	ChromeCallToolDefinition,
	ChromeCallToolHandler,
	ChromeCallToolInputSchema,
	ChromeCallToolRegistrar,
	ChromeCallRegisteredTool,
} from "./chrome-call.types";
import { runChromeCallTool, type ChromeBridge } from "./chrome-call";
import {
	chromeCallToolDefinition,
	chromeCallToolName,
} from "./chrome-call-definition";

export type ChromeCallToolName = typeof chromeCallToolName;
export type {
	ChromeCallToolDefinition,
	ChromeCallToolHandler,
	ChromeCallToolInputSchema,
	ChromeCallToolRegistrar,
	ChromeCallRegisteredTool,
};

export function createChromeCallToolHandler(
	bridge: ChromeBridge,
): ChromeCallToolHandler {
	return (input) => runChromeCallTool(input, bridge);
}

export function registerChromeCallTool(
	server: ChromeCallToolRegistrar,
	bridge: ChromeBridge,
): ChromeCallRegisteredTool {
	return server.registerTool(
		chromeCallToolName,
		chromeCallToolDefinition,
		createChromeCallToolHandler(bridge),
	);
}
