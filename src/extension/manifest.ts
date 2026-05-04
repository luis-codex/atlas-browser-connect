import { version } from "../shared/version";

const DEFAULT_PERMISSIONS = [
	"tabs",
	"tabGroups",
	"activeTab",
	"bookmarks",
	"windows",
];

export function generateManifest(permissions?: string[]) {
	const perms = new Set(permissions ?? DEFAULT_PERMISSIONS);
	perms.add("nativeMessaging"); // always required for transport

	return {
		manifest_version: 3,
		name: "Atlas Browser Connect",
		version,
		minimum_chrome_version: "105",
		permissions: [...perms].sort(),
		background: {
			service_worker: "background.js",
			type: "module",
		},
	};
}
