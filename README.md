# atlas-browser-connect

Expose Chromium extension APIs to MCP clients through Manifest V3 Native
Messaging.

`atlas-browser-connect` gives agents one portable MCP tool, `chrome_call`, for
calling permitted `chrome.*` extension APIs from Chrome, Edge, Brave, Chromium,
or Chrome for Testing. Use it to inspect and control browser state through the
same APIs an extension can use: tabs, windows, tab groups, bookmarks, and any
other MV3 service-worker API granted by the extension manifest.

Common calls include `tabs.query`, `windows.getAll`, `bookmarks.getTree`,
`bookmarks.search`, `tabGroups.query`, and other permitted namespace/method
pairs.

Chrome, Edge, Brave, or Chromium decide what is allowed through their normal
extension permission model. The bridge does not bypass Manifest V3 permissions.

## How It Works

```text
Agent / MCP client
  -> MCP stdio server
    -> local pipe
      -> Native Messaging host
        <-> extension service worker
          -> chrome[namespace][method](...args)
```

The MCP server and Native Messaging host are separate processes because both use
stdio, but with different protocols.

## Requirements

- Node.js and npm. The recommended runtime flow uses `npx`.
- Chrome, Edge, Brave, Chromium, or Chrome for Testing.
- Developer mode enabled in the browser extension page.

## Quick Start

1. Generate the unpacked extension directory:

```bash
npx -y atlas-browser-connect extension build
```

The command prints the folder that must be loaded into the browser.

2. Load the extension:

```text
Chrome:   chrome://extensions
Edge:     edge://extensions
Brave:    brave://extensions
Chromium: chromium://extensions
```

Enable developer mode, choose "Load unpacked", select the generated extension
folder, and copy the generated extension ID.

3. Register the Native Messaging host:

```bash
npx -y atlas-browser-connect native register --extension-id <EXTENSION_ID> --browser chrome
```

Supported browser values are `chrome`, `edge`, `brave`, `chromium`, and
`chrome-for-testing`.

The register command installs the Native Messaging host into a stable user data
directory before writing the browser manifest. It does not register a path inside
the temporary `npx` package cache.

4. Reload the extension card in the browser.

5. Add the MCP server to your client config:

```json
{
	"mcpServers": {
		"atlas-browser-connect": {
			"command": "npx",
			"args": ["-y", "atlas-browser-connect@latest", "mcp"]
		}
	}
}
```

The MCP command does not need the extension ID. The extension ID is only used by
`native register` to authorize the loaded extension in the Native Messaging
manifest.

## CLI Commands

Generate or refresh the unpacked extension:

```bash
npx -y atlas-browser-connect extension build
```

Choose a custom extension output directory:

```bash
npx -y atlas-browser-connect extension build --out ./atlas-extension
```

Register Native Messaging:

```bash
npx -y atlas-browser-connect native register --extension-id <EXTENSION_ID> --browser chrome
```

Unregister one browser:

```bash
npx -y atlas-browser-connect native unregister --browser chrome
```

Unregister all supported browser targets:

```bash
npx -y atlas-browser-connect native unregister --browser all
```

Check local installation paths:

```bash
npx -y atlas-browser-connect doctor
```

## MCP Client Examples

### Claude Desktop

```json
{
	"mcpServers": {
		"atlas-browser-connect": {
			"command": "npx",
			"args": ["-y", "atlas-browser-connect@latest", "mcp"]
		}
	}
}
```

### VS Code

For `.vscode/mcp.json`:

```json
{
	"servers": {
		"atlas-browser-connect": {
			"type": "stdio",
			"command": "npx",
			"args": ["-y", "atlas-browser-connect@latest", "mcp"]
		}
	}
}
```

Some VS Code MCP clients use `mcpServers` instead of `servers`; use the shape
your client expects.

### Codex

```json
{
	"mcpServers": {
		"atlas-browser-connect": {
			"command": "npx",
			"args": ["-y", "atlas-browser-connect@latest", "mcp"]
		}
	}
}
```

## Using `chrome_call`

Query tabs:

```json
{
	"namespace": "tabs",
	"method": "query",
	"args": [{ "active": true, "currentWindow": true }]
}
```

Get browser windows:

```json
{
	"namespace": "windows",
	"method": "getAll",
	"args": [{ "populate": true }]
}
```

The call succeeds only when the API is available from an MV3 service worker and
the extension manifest has the required permission.

## Project Layout

```text
apps/
  chrome-extension/       MV3 extension runtime
  cli/                    npm command surface
  mcp-server/             MCP stdio server
  native-messaging-host/  Chrome Native Messaging host
packages/
  chrome-bridge-protocol/ Shared request/response contract
  native-bridge-path/     Local pipe/socket naming
scripts/                  Build automation
```

Each executable app uses a lightweight Ports and Adapters layout:

```text
app/
  src/   runtime code grouped by responsibility
  test/  tests for that app
```

## Development

Development requires [Bun](https://bun.sh/).

```bash
bun install
bun test
bun run typecheck
bun run check
bun run build
bun run package:check
```

Run the built MCP server:

```bash
bun run mcp
```

## Publishing

Publishing to npm runs from `.github/workflows/publish.yml` when a tag matching
`v*` is pushed.

Configure npm Trusted Publishing for:

- package: `atlas-browser-connect`
- GitHub owner/user: `luis-codex`
- repository: `atlas-browser-connect`
- workflow filename: `publish.yml`

No npm token is needed. Before tagging a release, update `package.json`
`version`; npm rejects publishing the same version twice.

## Troubleshooting

### Native messaging host not found

Run the register command again with the current extension ID, then reload the
extension:

```bash
npx -y atlas-browser-connect native register --extension-id <EXTENSION_ID> --browser chrome
```

### Access to the native host is forbidden

The extension ID in `allowed_origins` does not match the loaded extension.
Re-run `native register` with the current extension ID from the browser
extension page.

### `Chrome native host is not connected`

Reload the extension after registering the host. The background service worker
must open the Native Messaging connection before the MCP server can reach the
local bridge.

### A Chrome API call fails

Check that:

- the extension manifest includes the required permission;
- the API is available from an MV3 service worker;
- the method does not require user activation;
- the namespace and method names are valid.

## License

MIT. See [LICENSE](LICENSE).
