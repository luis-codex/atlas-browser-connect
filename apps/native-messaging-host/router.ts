import type {
	ChromeCallRequest,
	ChromeCallResponse,
} from "../../packages/chrome-bridge-protocol/protocol";

type WriteChromeMessage = (message: ChromeCallRequest) => void;

export class ChromeRequestRouter {
	readonly #pending = new Map<string, (response: ChromeCallResponse) => void>();

	constructor(private readonly writeChromeMessage: WriteChromeMessage) {}

	routeRequest(request: ChromeCallRequest): Promise<ChromeCallResponse> {
		this.writeChromeMessage(request);

		return new Promise((resolve) => {
			this.#pending.set(request.id, resolve);
		});
	}

	handleChromeMessage(message: ChromeCallResponse) {
		const resolve = this.#pending.get(message.id);

		if (!resolve) {
			return;
		}

		this.#pending.delete(message.id);
		resolve(message);
	}
}
