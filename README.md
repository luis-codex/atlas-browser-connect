# Atlas Browser Connect

[![npm version](https://img.shields.io/npm/v/atlas-browser-connect.svg)](https://www.npmjs.com/package/atlas-browser-connect)

> All the power of Chrome's extension APIs, accessible from **any** AI agent via
> the Model Context Protocol. One tool. Any model. Zero vendor lock-in.

## Why Atlas?

Products like Claude for Chrome give browser superpowers to one AI model.
**Atlas gives them to all of them.**

Atlas Browser Connect exposes a single MCP tool — `chrome_call` — that can
invoke _any_ `chrome.*` extension API. Since Chrome's API surface covers
**everything** — tabs, scripting, debugger, downloads, cookies, history,
bookmarks, storage, and [200+ more](https://developer.chrome.com/docs/extensions/reference/api) —
one tool is all an agent needs to see, understand, and control the browser.

You decide how much power to grant by choosing which **permissions** to include
when building the extension. The agent gets exactly the capabilities you allow,
nothing more.

| | Claude for Chrome | Atlas Browser Connect |
| --- | --- | --- |
| **AI model** | Claude only | Any MCP-compatible agent |
| **Protocol** | Proprietary | Open (MCP) |
| **Browser support** | Chrome only | Chrome, Edge, Brave, Chromium |
| **Source** | Closed | Open-source (MIT) |
| **Control level** | UI-level | API-level (`chrome.*`) |
| **Capabilities** | Fixed by Anthropic | You choose the permissions |

## What Can an Agent Do?

Everything that Chrome extensions can do — it depends on the permissions you
grant:

| Permission | What the agent can do | Example call |
| --- | --- | --- |
| `tabs` | Inspect, create, close, move tabs | `tabs.query`, `tabs.create` |
| `activeTab` | Read the active tab's URL and title | `tabs.get` |
| `scripting` | **Inject scripts, read DOM, extract page content** | `scripting.executeScript` |
| `debugger` | **Full Chrome DevTools Protocol access** | `debugger.attach`, `debugger.sendCommand` |
| `tabCapture` | **Capture tab audio/video streams** | `tabCapture.capture` |
| `windows` | Manage browser windows | `windows.getAll`, `windows.create` |
| `bookmarks` | Search and organize bookmarks | `bookmarks.search`, `bookmarks.create` |
| `history` | Browse and search history | `history.search`, `history.getVisits` |
| `downloads` | Download files, monitor progress | `downloads.download`, `downloads.search` |
| `cookies` | Read and set cookies | `cookies.getAll`, `cookies.set` |
| `storage` | Persistent key-value storage | `storage.local.get`, `storage.local.set` |
| `notifications` | Show desktop notifications | `notifications.create` |
| `tabGroups` | Organize tabs into groups | `tabGroups.query`, `tabGroups.update` |
| `alarms` | Schedule timed events | `alarms.create`, `alarms.getAll` |

> **The full list**: any API in the
> [Chrome Extensions API reference](https://developer.chrome.com/docs/extensions/reference/api)
> that works from a MV3 service worker.

### Power examples

**Read a page's DOM** (needs `scripting`):

```json
{
  "namespace": "scripting",
  "method": "executeScript",
  "args": [{ "target": { "tabId": 123 }, "func": "() => document.body.innerText" }]
}
```

**Take a screenshot** (needs `activeTab`):

```json
{
  "namespace": "tabs",
  "method": "captureVisibleTab",
  "args": [null, { "format": "png" }]
}
```

**Access DevTools Protocol** (needs `debugger`):

```json
{
  "namespace": "debugger",
  "method": "sendCommand",
  "args": [{ "tabId": 123 }, "DOM.getDocument"]
}
```

**Download a file** (needs `downloads`):

```json
{
  "namespace": "downloads",
  "method": "download",
  "args": [{ "url": "https://example.com/report.pdf" }]
}
```

## Quick Start

### 1. Build the extension

```bash
npx -y atlas-browser-connect extension build
```

The default extension includes: `tabs`, `tabGroups`, `activeTab`, `bookmarks`,
`windows`, `nativeMessaging`.

To customize permissions:

```bash
npx -y atlas-browser-connect extension build \
  --permissions tabs,scripting,debugger,downloads,cookies
```

### 2. Load it in your browser

| Browser  | Extensions page          |
| -------- | ------------------------ |
| Chrome   | `chrome://extensions`    |
| Edge     | `edge://extensions`      |
| Brave    | `brave://extensions`     |
| Chromium | `chromium://extensions`  |

Enable developer mode → **Load unpacked** → select the generated folder → copy
the **extension ID**.

### 3. Register the Native Messaging host

```bash
npx -y atlas-browser-connect native register --extension-id <ID> --browser chrome
```

Supported browsers: `chrome`, `edge`, `brave`, `chromium`, `chrome-for-testing`.

### 4. Reload the extension

### 5. Connect your AI agent

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

Works with **Claude Desktop, VS Code, Cursor, Codex, Gemini CLI**, or any
MCP-compatible client.

<details>
<summary>VS Code / Cursor config</summary>

`.vscode/mcp.json`:

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

</details>

## CLI Reference

| Command | Description |
| --- | --- |
| `extension build [--out <path>]` | Generate the unpacked extension |
| `native register --extension-id <id> --browser <b>` | Register Native Messaging host |
| `native unregister --browser <b\|all>` | Remove host registration |
| `mcp` | Start the MCP stdio server |
| `doctor` | Check local installation paths |

All commands: `npx -y atlas-browser-connect <command>`.

## Architecture

```text
src/
  shared/       Protocol types and bridge path config
  extension/    Chrome MV3 extension (background service worker)
  host/         Native Messaging host (stdin/stdout ↔ local pipe)
  server/       MCP stdio server (chrome_call tool)
  cli/          CLI surface (build, register, doctor)
    native/     Platform-specific registration
test/           Tests mirroring src/
scripts/        Build automation
```

## Development

Requires [Bun](https://bun.sh/).

```bash
bun install
bun test
bun run typecheck
bun run check
bun run build
```

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Native host not found | Re-run `native register`, reload extension |
| Access forbidden | Extension ID mismatch — re-run `native register` |
| Host not connected | Reload extension after registering |
| API call fails | Check permissions in manifest, MV3 availability |

## License

MIT. See [LICENSE](LICENSE).
