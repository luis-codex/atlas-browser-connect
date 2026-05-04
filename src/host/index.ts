import process from "node:process";

import { startNativeMessagingHost } from "./host";

const host = startNativeMessagingHost({
	input: process.stdin,
	output: process.stdout,
});

host.ready.catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
