import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { version } from "../shared/version";
import { probeExtensionManifest, registerChromeCallTool } from "./chrome-call";
import { sendChromeCall } from "./bridge";

const manifest = await probeExtensionManifest(sendChromeCall);

const server = new McpServer({
	name: "atlas-browser-connect",
	version,
});

registerChromeCallTool(server, sendChromeCall, manifest);

const transport = new StdioServerTransport();
await server.connect(transport);
