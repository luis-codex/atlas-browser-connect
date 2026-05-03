import { expect, test } from "bun:test";

import {
	chromeCallToolDefinition,
	chromeCallToolName,
} from "../../src/tools/chrome-call-definition";
import {
	createChromeCallToolHandler,
	registerChromeCallTool,
} from "../../src/tools/chrome-call-registration";
import type { ChromeCallToolRegistrar } from "../../src/tools/chrome-call.types";

test("registerChromeCallTool registers chrome_call with its definition", () => {
	let registration:
		| {
				definition: unknown;
				handler: unknown;
				name: string;
		  }
		| undefined;

	const server = {
		registerTool(name, definition, handler) {
			registration = { definition, handler, name };

			return {
				description: definition.description,
				enabled: true,
				handler,
			};
		},
	} as ChromeCallToolRegistrar;

	const registeredTool = registerChromeCallTool(server, async (request) => ({
		id: request.id,
		ok: true,
		result: [],
	}));

	expect(registration?.name).toBe(chromeCallToolName);
	expect(registration?.definition).toBe(chromeCallToolDefinition);
	expect(registration?.handler).toBeFunction();
	expect(registeredTool.enabled).toBe(true);
});

test("createChromeCallToolHandler returns a typed MCP tool handler", async () => {
	const handler = createChromeCallToolHandler(async (request) => ({
		id: request.id,
		ok: true,
		result: [{ id: 1, active: true }],
	}));

	const result = await handler(
		{
			args: [{ active: true, currentWindow: true }],
			method: "query",
			namespace: "tabs",
		},
		{} as never,
	);

	expect(result).toEqual({
		content: [
			{
				text: JSON.stringify([{ id: 1, active: true }], null, 2),
				type: "text",
			},
		],
	});
});
