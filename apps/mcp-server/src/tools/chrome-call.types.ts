import type {
	McpServer,
	RegisteredTool,
	ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

export type ChromeCallToolInputSchema = {
	args: z.ZodType<unknown[]>;
	method: z.ZodType<string>;
	namespace: z.ZodType<string>;
};

export type ChromeCallToolExample = {
	args: unknown[];
	method: string;
	namespace: string;
	purpose: string;
};

export type ChromeCallToolMetadata = {
	"atlas-browser-connect/capabilities": string[];
	"atlas-browser-connect/examples": ChromeCallToolExample[];
};

export type ChromeCallToolDefinition = {
	_meta: ChromeCallToolMetadata;
	annotations: ToolAnnotations;
	description: string;
	inputSchema: ChromeCallToolInputSchema;
	title: string;
};

export type ChromeCallToolHandler = ToolCallback<ChromeCallToolInputSchema>;
export type ChromeCallToolRegistrar = Pick<McpServer, "registerTool">;
export type ChromeCallRegisteredTool = RegisteredTool;
