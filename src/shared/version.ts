/**
 * Project version — single source of truth.
 *
 * Uses createRequire to read package.json synchronously at module load.
 * Works in both bundled (dist/) and unbundled (src/) contexts because
 * Bun.build bundles the JSON content inline.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { version: string };

export const version: string = pkg.version;
