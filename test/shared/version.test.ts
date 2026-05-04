import { expect, test } from "bun:test";

import { version } from "../../src/shared/version";

test("version is a valid semver string read from package.json", () => {
	expect(version).toMatch(/^\d+\.\d+\.\d+/);
});
