# Atlas Browser Connect

Expose permitted Chromium extension APIs to any AI agent via the Model Context Protocol. One tool, any model, zero vendor lock-in.

## Language

### Core protocol

**chrome_call**:
The single MCP tool that forwards a namespace + method + args triple to the Chrome extension runtime.
_Avoid_: action, command, RPC

**Namespace**:
A top-level Chrome extension API surface (e.g. `tabs`, `bookmarks`, `scripting`). Passed as a plain identifier without `chrome.` prefix.
_Avoid_: module, service, API group

**Method**:
A function within a **Namespace** (e.g. `query`, `getAll`, `executeScript`).
_Avoid_: action, endpoint

### Transport

**Bridge**:
The local pipe (named pipe on Windows, Unix socket elsewhere) connecting the MCP server to the Native Messaging Host.
_Avoid_: channel, socket, IPC

**Bridge path**:
The filesystem address of the **Bridge** — platform-specific.
_Avoid_: socket path, pipe path (use the term, not the mechanism)

**Native Messaging Host**:
A Node process launched by Chrome's Native Messaging protocol. Reads/writes length-prefixed JSON frames on stdin/stdout and exposes a **Bridge** for the MCP server.
_Avoid_: host process, daemon, sidecar

**Framing**:
The length-prefix encoding (4-byte LE uint32 + JSON body) used by Chrome's Native Messaging protocol on stdin/stdout.
_Avoid_: wire format, serialization

**Router**:
The request-correlation layer inside the Native Messaging Host. Sends requests to Chrome, holds them in a pending map with a timeout, and resolves when Chrome responds.
_Avoid_: dispatcher, handler, multiplexer

### Extension

**Extension**:
A Chrome Manifest V3 extension that receives **chrome_call** requests via Native Messaging and dispatches them to the Chrome runtime.
_Avoid_: plugin, add-on

**Manifest**:
The generated `manifest.json` that declares the extension's **Permissions** and background service worker.
_Avoid_: config, extension config

**Permissions**:
Chrome extension permissions selected at build time. They define the ceiling of what **chrome_call** can invoke.
_Avoid_: capabilities, scopes, grants

### CLI

**Extension build**:
The `extension build` CLI command that bundles the background service worker and generates a **Manifest** with the requested **Permissions**.
_Avoid_: compile, package

**Native register**:
The `native register` CLI command that installs the **Native Messaging Host** launcher, its JSON manifest, and any Windows registry keys for a specific browser.
_Avoid_: install, setup

**Browser target**:
The platform-specific filesystem paths and registry keys where a browser looks for Native Messaging Host manifests.
_Avoid_: browser config, browser paths

## Relationships

- A **chrome_call** request flows: MCP server → **Bridge** → **Native Messaging Host** → **Extension** → `chrome[namespace][method](...args)`
- The **Router** inside the **Native Messaging Host** correlates outgoing requests with incoming Chrome responses over **Framing**
- The **Manifest** declares which **Permissions** the **Extension** has, which bounds what **chrome_call** can do
- The **Extension build** command generates both the bundled service worker and the **Manifest**
- **Native register** writes to **Browser target** paths so Chrome can discover the **Native Messaging Host**

## Example dialogue

> **Dev:** "The agent called `chrome_call` with namespace `scripting`, but got a permission error."
> **Domain expert:** "Did the **Extension build** include `scripting` in its **Permissions**? The **Manifest** defines the ceiling — if it wasn't granted at build time, the **Extension** can't call it."

> **Dev:** "The **Bridge** isn't connecting."
> **Domain expert:** "Check that **Native register** ran for the right browser. The **Native Messaging Host** won't start unless Chrome finds its manifest in the **Browser target** paths."

## Flagged ambiguities

- "host" was ambiguous — could mean the **Native Messaging Host** process or the host machine. Resolved: always say **Native Messaging Host** for the process.
- "manifest" was ambiguous — could mean the extension's `manifest.json` (**Manifest**) or the Native Messaging Host's JSON manifest written by **Native register**. Resolved: unqualified **Manifest** means the extension manifest; the host manifest is called "native host manifest" or "NMH manifest".
