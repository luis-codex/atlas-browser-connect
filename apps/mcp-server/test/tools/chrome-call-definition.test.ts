import { expect, test } from "bun:test";
import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
	chromeCallToolDefinition,
	chromeCallToolName,
} from "../../src/tools/chrome-call-definition";
import type {
	ChromeCallToolDefinition,
	ChromeCallToolInputSchema,
} from "../../src/tools/chrome-call.types";

const typedChromeCallToolDefinition: ChromeCallToolDefinition =
	chromeCallToolDefinition;

const typedChromeCallToolHandler: ToolCallback<ChromeCallToolInputSchema> = (
	input,
) => ({
	content: [
		{
			text: `${input.namespace}.${input.method}`,
			type: "text" as const,
		},
	],
});

test("chrome_call definition is discoverable for agents", () => {
	expect(chromeCallToolName).toBe("chrome_call");
	expect(typedChromeCallToolDefinition.title).toBe("Call Chrome Extension API");
	expect(typedChromeCallToolHandler).toBeFunction();
	expect(chromeCallToolDefinition.title).toBe("Call Chrome Extension API");
	expect(chromeCallToolDefinition.description).toContain(
		"Pass the Chrome namespace and method separately",
	);
	expect(chromeCallToolDefinition.description).toContain(
		"Discovery/introspection",
	);
	expect(chromeCallToolDefinition.description).toContain("tabs.query");
	expect(chromeCallToolDefinition.description).toContain("windows.getAll");
});

test("chrome_call schema documents supported arguments", () => {
	expect(chromeCallToolDefinition.inputSchema.namespace.description).toContain(
		"Examples: tabs, windows, bookmarks, tabGroups",
	);
	expect(chromeCallToolDefinition.inputSchema.method.description).toContain(
		"Examples: query, get, getAll",
	);
	expect(chromeCallToolDefinition.inputSchema.args.description).toContain(
		"Positional arguments",
	);
});

test("chrome_call metadata includes capabilities and examples", () => {
	expect(chromeCallToolDefinition.annotations.openWorldHint).toBe(true);
	expect(chromeCallToolDefinition.annotations.readOnlyHint).toBe(false);
	expect(
		chromeCallToolDefinition._meta["atlas-browser-connect/capabilities"],
	).toContain(
		"Calls Chrome extension APIs available to the MV3 service worker",
	);
	expect(
		chromeCallToolDefinition._meta["atlas-browser-connect/examples"],
	).toContainEqual({
		args: [{ populate: true }],
		method: "getAll",
		namespace: "windows",
		purpose: "Inspect all browser windows and their tabs",
	});
});
