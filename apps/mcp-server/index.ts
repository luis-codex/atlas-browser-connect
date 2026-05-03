import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { sendChromeCall } from "./native-bridge";
import { runChromeCallTool } from "./tools";

const server = new McpServer({
	name: "atlas-browser-connect",
	version: "0.1.0",
});

server.registerTool(
	"chrome_call",
	{
		description: "Calls a Chrome extension API through Atlas Native Messaging.",
		inputSchema: {
			args: z
				.array(z.unknown())
				.optional()
				.describe("Arguments for the method."),
			method: z.string().describe("Chrome API method, for example query."),
			namespace: z.string().describe("Chrome API namespace, for example tabs."),
		},
	},
	(input) => runChromeCallTool(input, sendChromeCall),
);

const transport = new StdioServerTransport();
await server.connect(transport);
