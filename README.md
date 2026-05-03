# atlas-browser-connect

Bridge MCP clients to Chromium extension APIs through Manifest V3 Native
Messaging.

`atlas-browser-connect` exposes one MCP tool, `chrome_call`, that forwards calls
to the browser extension runtime:

```json
{
	"namespace": "tabs",
	"method": "query",
	"args": [{ "active": true, "currentWindow": true }]
}
```

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

- [Node.js](https://nodejs.org/) to run the MCP server from a release package.
- Chrome, Edge, Brave, or Chromium.
- Bash-compatible shell for `scripts/register-native-host.sh`.
  - Windows: Git Bash, MSYS2, Cygwin, or WSL.
  - Linux/macOS: the system shell is usually enough.

## Quick Start

1. Download the release package for your operating system:

```text
atlas-browser-connect-windows-x64.zip
atlas-browser-connect-linux-x64.tar.gz
atlas-browser-connect-macos-x64.tar.gz
atlas-browser-connect-macos-arm64.tar.gz
```

2. Extract the package.

3. Load the extension:

```text
Chrome: chrome://extensions
Edge:   edge://extensions
Brave:  brave://extensions
```

Enable developer mode, choose "Load unpacked", select
`dist/chrome-extension`, and copy the generated extension ID.

4. Register the Native Messaging host:

```bash
./scripts/register-native-host.sh <EXTENSION_ID>
```

The script detects supported browsers and asks which one to configure. You can
also pass the browser explicitly:

```bash
./scripts/register-native-host.sh <EXTENSION_ID> brave
```

Supported values are `chrome`, `edge`, `brave`, `chromium`, and
`chrome-for-testing`.

5. Reload the extension card in the browser.

6. Add the MCP server to your client config.

Use the built Node entrypoint:

```json
{
	"command": "node",
	"args": ["<ABSOLUTE_REPO_PATH>/dist/mcp/index.js"]
}
```

On Windows, use escaped backslashes:

```json
{
	"command": "node",
	"args": [
		"C:\\path\\to\\atlas-browser-connect\\dist\\mcp\\index.js"
	]
}
```

## Uninstall

Remove the Native Messaging registration for one browser:

```bash
./scripts/unregister-native-host.sh brave
```

Or remove every supported browser target known by the project:

```bash
./scripts/unregister-native-host.sh --all
```

The unregister script removes only the Native Messaging registration and
manifest created by this project. It does not delete `dist`, source files, or
the browser extension. Reload or close the browser after unregistering so any
open native host connection is released.

## MCP Client Examples

### Claude Desktop

```json
{
	"mcpServers": {
		"atlas-browser-connect": {
			"command": "node",
			"args": ["<ABSOLUTE_REPO_PATH>/dist/mcp/index.js"]
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
			"command": "node",
			"args": ["<ABSOLUTE_REPO_PATH>/dist/mcp/index.js"]
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
			"command": "node",
			"args": ["<ABSOLUTE_REPO_PATH>/dist/mcp/index.js"]
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
  mcp-server/             MCP stdio server
  native-messaging-host/  Chrome Native Messaging host
packages/
  chrome-bridge-protocol/ Shared request/response contract
scripts/                  Build and installation automation
```

Each executable app uses the same lightweight Ports and Adapters layout:

```text
app/
  src/   runtime code grouped by responsibility
  test/  tests for that app
```

Folders use concrete names such as `transport`, `tools`, `runtime`, `host`, and
`router`. The project does not use MVC because this is a runtime integration,
not a UI or HTTP application.

## Development

Development requires [Bun](https://bun.sh/).

```bash
bun install
bun test
bun run typecheck
bun run check
bun run build
```

Format and apply safe fixes:

```bash
bun run check:fix
```

Run the built MCP server:

```bash
bun run mcp
```

Run source entrypoints during development:

```bash
bun run mcp:dev
bun run native-messaging-host
```

Normally the browser starts the native host. Running it manually is only useful
for debugging.

Create a local release package:

```bash
bun run build
bun run package
```

Packages are written to `release/`.

## CI/CD

GitHub Actions validates the project on Windows, Linux, and macOS:

- tests;
- typecheck;
- Biome check;
- build;
- MCP bundle syntax;
- release package creation.

Tagged releases matching `v*` publish OS-specific archives as GitHub Release
assets. The release workflow can also be run manually with a tag input.

## Troubleshooting

### Native messaging host not found

Run `bun run build`, register the host again with the current extension ID, then
reload the extension:

```bash
./scripts/register-native-host.sh <EXTENSION_ID>
```

On Windows, the generated Native Messaging manifest is stored under the user
profile instead of `dist`, so rebuilding does not delete the browser
registration.

### Access to the native host is forbidden

The extension ID in `allowed_origins` does not match the loaded extension.
Re-run the registration script with the current extension ID.

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
