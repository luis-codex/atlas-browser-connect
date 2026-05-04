import type { ChromeCallRequest, ChromeCallResponse } from "../shared/protocol";

type WriteChromeMessage = (message: ChromeCallRequest) => void;

type RouterOptions = {
	requestTimeoutMs?: number;
};

type PendingRequest = {
	resolve: (response: ChromeCallResponse) => void;
	timer: ReturnType<typeof setTimeout>;
};

export class ChromeRequestRouter {
	readonly #pending = new Map<string, PendingRequest>();
	readonly #requestTimeoutMs: number;

	constructor(
		private readonly writeChromeMessage: WriteChromeMessage,
		options: RouterOptions = {},
	) {
		this.#requestTimeoutMs = options.requestTimeoutMs ?? 10_000;
	}

	routeRequest(request: ChromeCallRequest): Promise<ChromeCallResponse> {
		this.writeChromeMessage(request);

		return new Promise((resolve) => {
			const timer = setTimeout(() => {
				this.#pending.delete(request.id);
				resolve({
					error: { message: "Chrome extension did not answer in time" },
					id: request.id,
					ok: false,
				});
			}, this.#requestTimeoutMs);

			this.#pending.set(request.id, { resolve, timer });
		});
	}

	handleChromeMessage(message: ChromeCallResponse) {
		const pendingRequest = this.#pending.get(message.id);

		if (!pendingRequest) {
			return;
		}

		this.#pending.delete(message.id);
		clearTimeout(pendingRequest.timer);
		pendingRequest.resolve(message);
	}
}
