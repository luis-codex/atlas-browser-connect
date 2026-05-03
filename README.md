# atlas-browser-connect

Atlas Browser Connect lets MCP clients call Chrome extension APIs through a
Manifest V3 extension and a Native Messaging host.

The first milestone is `tabs.query`, but the contract is generic:

```json
{
	"namespace": "tabs",
	"method": "query",
	"args": [{ "active": true, "currentWindow": true }]
}
```

Chrome's own extension permission model decides what is allowed. The bridge does
not add permissions beyond the extension manifest.

## Architecture

```text
Agent or MCP client
  -> MCP stdio server
    -> local named pipe
      -> Native Messaging host
        <-> browser extension service worker
          -> chrome[namespace][method](...args)
```

Why the split matters:

- MCP uses stdio to talk to agents.
- Chrome Native Messaging also uses stdio, but with a different protocol.
- Those two stdio protocols must live in separate processes.

This project keeps them separated:

- `apps/mcp-server`: MCP stdio server exposing `chrome_call`.
- `apps/native-messaging-host`: Chrome Native Messaging host and local bridge.
- `apps/chrome-extension`: MV3 extension background runtime.
- `packages/chrome-bridge-protocol`: reusable request/response contract shared by apps.

## Requirements

- [Node.js](https://nodejs.org/) to run the built MCP server.
- [Bun](https://bun.sh/) for development and building this repository.
- A Chromium-based browser:
  - Google Chrome
  - Microsoft Edge
  - Brave
  - Chromium
- Bash-compatible shell for `scripts/register-native-host.sh`
  - Linux/macOS: available by default in most environments.
  - Windows: use Git Bash, MSYS2, Cygwin, or WSL.

## Install

```bash
bun install
```

## Build

```bash
bun run build
```

This creates:

```text
dist/chrome-extension/manifest.json
dist/chrome-extension/background.js
dist/mcp/index.js
dist/native-messaging-host/atlas-native-messaging-host.exe       # Windows
dist/native-messaging-host/atlas-native-messaging-host           # Linux/macOS
```

The build script picks the native host filename for the current OS.

## Load The Extension

1. Open your browser extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Enable developer mode.
3. Choose "Load unpacked".
4. Select:

```text
dist/chrome-extension
```

5. Copy the generated extension ID.

## Register The Native Host

Run:

```bash
./scripts/register-native-host.sh <EXTENSION_ID>
```

If you do not pass a browser, the script detects supported browsers and asks:

```text
Detected browsers:
  1) Google Chrome
  2) Microsoft Edge
  3) Brave
Select browser [1-3]:
```

You can also register non-interactively:

```bash
./scripts/register-native-host.sh <EXTENSION_ID> chrome
./scripts/register-native-host.sh <EXTENSION_ID> edge
./scripts/register-native-host.sh <EXTENSION_ID> brave
./scripts/register-native-host.sh <EXTENSION_ID> chromium
```

The script writes the Native Messaging manifest and registers it in the location
expected by the selected browser.

## Configure An MCP Client

For normal use, point your MCP client to the built MCP server:

```json
{
	"command": "node",
	"args": ["dist/mcp/index.js"]
}
```

Use an absolute path if the client does not run from this repository folder:

```json
{
	"command": "node",
	"args": [
		"D:\\User\\Ingenieria\\Repositorios\\qbytes\\atlas-browser-connect\\dist\\mcp\\index.js"
	]
}
```

For development only, you can run the TypeScript source:

```json
{
	"command": "bun",
	"args": ["run", "apps/mcp-server/index.ts"]
}
```

### Claude Desktop

Add this to your Claude Desktop MCP config:

```json
{
	"mcpServers": {
		"atlas-browser-connect": {
			"command": "node",
			"args": [
				"D:\\User\\Ingenieria\\Repositorios\\qbytes\\atlas-browser-connect\\dist\\mcp\\index.js"
			]
		}
	}
}
```

### VS Code

If your VS Code MCP client reads `.vscode/mcp.json`, use:

```json
{
	"servers": {
		"atlas-browser-connect": {
			"type": "stdio",
			"command": "node",
			"args": [
				"D:\\User\\Ingenieria\\Repositorios\\qbytes\\atlas-browser-connect\\dist\\mcp\\index.js"
			]
		}
	}
}
```

Some VS Code clients use a `mcpServers` shape instead:

```json
{
	"mcpServers": {
		"atlas-browser-connect": {
			"command": "node",
			"args": [
				"D:\\User\\Ingenieria\\Repositorios\\qbytes\\atlas-browser-connect\\dist\\mcp\\index.js"
			]
		}
	}
}
```

### Codex

For Codex MCP configuration, use the same stdio command:

```json
{
	"mcpServers": {
		"atlas-browser-connect": {
			"command": "node",
			"args": [
				"D:\\User\\Ingenieria\\Repositorios\\qbytes\\atlas-browser-connect\\dist\\mcp\\index.js"
			]
		}
	}
}
```

On Linux/macOS, replace the Windows path with your absolute repo path, for
example:

```json
{
	"command": "node",
	"args": ["/Users/you/code/atlas-browser-connect/dist/mcp/index.js"]
}
```

## Tool: chrome_call

`chrome_call` accepts:

```json
{
	"namespace": "tabs",
	"method": "query",
	"args": [{ "active": true, "currentWindow": true }]
}
```

That calls:

```ts
chrome.tabs.query({ active: true, currentWindow: true });
```

Another example:

```json
{
	"namespace": "windows",
	"method": "getAll",
	"args": [{ "populate": true }]
}
```

The extension only succeeds if the method is available in the MV3 service worker
context and the manifest grants the needed permissions.

## Development Commands

```bash
bun test
bun run typecheck
bun run check
bun run build
```

Fix formatting and safe lint fixes:

```bash
bun run check:fix
```

Run the MCP server:

```bash
bun run mcp
```

That script runs the built server with Node. For source development, use:

```bash
bun run mcp:dev
```

Run the native host directly for development:

```bash
bun run native-messaging-host
```

Normally Chrome starts the native host through Native Messaging, so manual
native-messaging-host execution is only useful while debugging.

## Troubleshooting

### The browser says the native host was not found

Run `bun run build` first, then register again:

```bash
./scripts/register-native-host.sh <EXTENSION_ID>
```

Make sure you selected the same browser where you loaded the extension.

### Access to the native host is forbidden

The extension ID in `allowed_origins` does not match the extension currently
loaded in the browser. Re-run the registration script with the current extension
ID.

### chrome_call returns "Chrome native host is not connected"

The MCP server could not reach the local bridge owned by the native host. Reload
the extension after registering the host so the background service worker opens
the Native Messaging connection.

### A Chrome API call fails

That is expected when:

- the extension manifest does not include the required permission;
- the API is unavailable from an MV3 service worker;
- the method requires user activation;
- the namespace or method name is invalid.

The bridge intentionally lets Chrome enforce those rules.
