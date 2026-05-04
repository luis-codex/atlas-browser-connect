import { expect, test } from "bun:test";

import {
	chromeCallToolDefinition,
	registerChromeCallTool,
} from "../../src/server/chrome-call";

// --- Definition tests (default / no manifest) ---

test("chrome_call definition is discoverable for agents", () => {
	expect(chromeCallToolDefinition.title).toBe("Call Chrome Extension API");
	expect(chromeCallToolDefinition.description).toContain(
		"Pass the Chrome namespace and method separately",
	);
	expect(chromeCallToolDefinition.description).toContain("Introspection");
	expect(chromeCallToolDefinition.description).toContain(
		"Extension is not connected",
	);
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

test("chrome_call metadata reflects disconnected state when no manifest", () => {
	expect(chromeCallToolDefinition.annotations.openWorldHint).toBe(true);
	expect(chromeCallToolDefinition.annotations.readOnlyHint).toBe(false);
	expect(
		chromeCallToolDefinition._meta["atlas-browser-connect/connected"],
	).toBe(false);
	expect(
		chromeCallToolDefinition._meta["atlas-browser-connect/capabilities"],
	).toEqual([]);
});

// --- Registration with manifest context ---

test("registerChromeCallTool includes manifest permissions in description", () => {
	let registeredDefinition: { description: string } | undefined;

	const server = {
		registerTool(_name: string, definition: unknown, handler: unknown) {
			registeredDefinition = definition as { description: string };

			return {
				description: (definition as { description: string }).description,
				enabled: true,
				handler,
			};
		},
	} as Parameters<typeof registerChromeCallTool>[0];

	registerChromeCallTool(
		server,
		async (request) => ({
			id: request.id,
			ok: true,
			result: [],
		}),
		{
			name: "Atlas Browser Connect",
			version: "0.1.2",
			permissions: ["tabs", "bookmarks", "scripting"],
		},
	);

	expect(registeredDefinition?.description).toContain(
		"tabs, bookmarks, scripting",
	);
	expect(registeredDefinition?.description).toContain(
		"Atlas Browser Connect v0.1.2",
	);
	expect(registeredDefinition?.description).not.toContain(
		"Extension is not connected",
	);
});

test("registerChromeCallTool registers chrome_call with handler", () => {
	let registration:
		| {
				definition: unknown;
				handler: unknown;
				name: string;
		  }
		| undefined;

	const server = {
		registerTool(name: string, definition: unknown, handler: unknown) {
			registration = { definition, handler, name };

			return {
				description: (definition as { description: string }).description,
				enabled: true,
				handler,
			};
		},
	} as Parameters<typeof registerChromeCallTool>[0];

	const registeredTool = registerChromeCallTool(server, async (request) => ({
		id: request.id,
		ok: true,
		result: [],
	}));

	expect(registration?.name).toBe("chrome_call");
	expect(registration?.handler).toBeFunction();
	expect(registeredTool.enabled).toBe(true);
});
