import { z } from "zod";

import type { ChromeCallToolDefinition } from "./chrome-call.types";

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

export const chromeCallToolName = "chrome_call";

export const chromeCallToolDefinition = {
	title: "Call Chrome Extension API",
	description: [
		"Calls a chrome.* API method from the connected Manifest V3 extension runtime.",
		"Use this tool when an agent needs browser state or browser actions exposed by the extension permissions, such as tabs.query, windows.getAll, bookmarks.search, or tabGroups.query.",
		"Pass the Chrome namespace and method separately: namespace='tabs', method='query' calls chrome.tabs.query(...args). Do not include 'chrome.' or dots in either field.",
		"args is the positional argument array passed directly to the Chrome API method. For methods that take one object, pass args as a one-item array containing that object.",
		"Discovery/introspection: call namespace='tabs', method='query', args=[{}] to inspect visible tabs; namespace='windows', method='getAll', args=[{\"populate\":true}] to inspect windows and tabs; namespace='bookmarks', method='getTree', args=[] to inspect bookmark shape; namespace='tabGroups', method='query', args=[{}] to inspect tab groups. Use Chrome extension API docs for exact method signatures.",
		"Chrome's Manifest V3 permission model is authoritative. Calls may fail when the extension lacks permission, the API is unavailable from a service worker, the method requires user activation, or the native host/extension is not connected.",
	].join("\n\n"),
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
		"atlas-browser-connect/capabilities": [
			"Calls Chrome extension APIs available to the MV3 service worker",
			"Supports tabs, windows, bookmarks, tabGroups, and other permitted chrome.* namespaces",
			"Can be used for API discovery by calling read/list/query methods with broad filters",
		],
		"atlas-browser-connect/examples": [
			{
				args: [{ active: true, currentWindow: true }],
				method: "query",
				namespace: "tabs",
				purpose: "Find the active tab in the current window",
			},
			{
				args: [{ populate: true }],
				method: "getAll",
				namespace: "windows",
				purpose: "Inspect all browser windows and their tabs",
			},
			{
				args: [],
				method: "getTree",
				namespace: "bookmarks",
				purpose: "Inspect bookmark tree structure",
			},
		],
	},
} satisfies ChromeCallToolDefinition;
