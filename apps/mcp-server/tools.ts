import {
	type ChromeCallInput,
	type ChromeCallRequest,
	type ChromeCallResponse,
	createChromeCallRequest,
} from "../../packages/chrome-bridge-protocol/protocol";

export type ChromeBridge = (
	request: ChromeCallRequest,
) => Promise<ChromeCallResponse>;

export async function runChromeCallTool(
	input: ChromeCallInput,
	bridge: ChromeBridge,
) {
	const request = createChromeCallRequest(input);
	const response = await bridge(request);

	if (!response.ok) {
		return {
			content: [{ type: "text" as const, text: response.error.message }],
			isError: true,
		};
	}

	return {
		content: [
			{
				text: JSON.stringify(response.result, null, 2),
				type: "text" as const,
			},
		],
	};
}
