import type {
	McpServer,
	RegisteredTool,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
	type ChromeCallInput,
	type ChromeCallRequest,
	type ChromeCallResponse,
	createChromeCallRequest,
} from "../shared/protocol";

// --- Schema ---

export type ChromeBridge = (
	request: ChromeCallRequest,
) => Promise<ChromeCallResponse>;

const chromeApiName = z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/, {
	message: "Use a single Chrome API identifier without dots.",
});

const chromeCallArgs = z
	.array(z.unknown())
	.optional()
	.default([])
	.describe(
		'Positional arguments forwarded to chrome[namespace][method](...args). Examples: tabs.query -> [{"active":true,"currentWindow":true}], windows.getAll -> [{"populate":true}], bookmarks.getTree -> [].',
	);

// --- Probe ---

type ExtensionManifest = {
	name?: string;
	permissions?: string[];
	version?: string;
};

export async function probeExtensionManifest(
	bridge: ChromeBridge,
): Promise<ExtensionManifest | null> {
	try {
		const request = createChromeCallRequest({
			namespace: "runtime",
			method: "getManifest",
			args: [],
		});
		const response = await bridge(request);

		if (!response.ok) {
			return null;
		}

		return response.result as ExtensionManifest;
	} catch {
		return null;
	}
}

// --- Definition ---

function buildDescription(manifest: ExtensionManifest | null): string {
	const lines = [
		"Calls any chrome.* API method from the connected Manifest V3 extension runtime.",
		"Pass the Chrome namespace and method separately: namespace='tabs', method='query' calls chrome.tabs.query(...args). Do not include 'chrome.' or dots in either field.",
		"args is the positional argument array passed directly to the Chrome API method. For methods that take one object, pass args as a one-item array containing that object.",
	];

	if (manifest) {
		const perms = manifest.permissions ?? [];
		lines.push(
			`Connected extension: ${manifest.name ?? "unknown"} v${manifest.version ?? "?"}. Granted permissions: [${perms.join(", ")}]. Only these namespaces are callable.`,
		);
	} else {
		lines.push(
			"Extension is not connected. Calls will fail until the extension and native host are running. Run `atlas-browser-connect doctor` to diagnose.",
		);
	}

	lines.push(
		"Introspection: call runtime.getManifest to see permissions, or permissions.getAll to list active grants.",
	);

	return lines.join("\n\n");
}

function buildToolDefinition(manifest: ExtensionManifest | null) {
	return {
		title: "Call Chrome Extension API",
		description: buildDescription(manifest),
		inputSchema: {
			namespace: chromeApiName.describe(
				"Chrome API namespace without 'chrome.' and without dots. Examples: tabs, windows, bookmarks, tabGroups.",
			),
			method: chromeApiName.describe(
				"Method name within the namespace. Examples: query, get, getAll, create, update, remove, getTree, search.",
			),
			args: chromeCallArgs,
		},
		annotations: {
			destructiveHint: false,
			idempotentHint: false,
			openWorldHint: true,
			readOnlyHint: false,
		},
		_meta: {
			"atlas-browser-connect/capabilities": manifest?.permissions ?? [],
			"atlas-browser-connect/connected": manifest !== null,
		},
	};
}

// Exported for tests that need a static reference
export const chromeCallToolDefinition = buildToolDefinition(null);

// --- Handler ---

export async function runChromeCallTool(
	input: ChromeCallInput,
	bridge: ChromeBridge,
) {
	const request = createChromeCallRequest(input);
	const response = await bridge(request);

	if (!response.ok) {
		return {
			content: [{ type: "text" as const, text: response.error.message }],
			isError: true,
		};
	}

	return {
		content: [
			{
				text: JSON.stringify(response.result, null, 2),
				type: "text" as const,
			},
		],
	};
}

// --- Registration ---

export function registerChromeCallTool(
	server: Pick<McpServer, "registerTool">,
	bridge: ChromeBridge,
	manifest: ExtensionManifest | null = null,
): RegisteredTool {
	const definition = buildToolDefinition(manifest);

	return server.registerTool("chrome_call", definition, (input) =>
		runChromeCallTool(input, bridge),
	);
}
