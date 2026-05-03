import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerChromeCallTool } from "./tools/chrome-call-registration";
import { sendChromeCall } from "./transport/native-bridge";

const server = new McpServer({
	name: "atlas-browser-connect",
	version: "0.1.0",
});

registerChromeCallTool(server, sendChromeCall);

const transport = new StdioServerTransport();
await server.connect(transport);
