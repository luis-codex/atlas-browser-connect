import { Command, CommanderError } from "commander";
import { z } from "zod";

export const supportedBrowsers = [
	"chrome",
	"edge",
	"brave",
	"chromium",
	"chrome-for-testing",
] as const;

const supportedBrowserSchema = z.enum(supportedBrowsers);
const unregisterBrowserSchema = z.union([
	supportedBrowserSchema,
	z.literal("all"),
]);
const extensionIdSchema = z
	.string()
	.regex(
		/^[a-p]{32}$/,
		"Extension id must be a 32-character Chrome extension id.",
	);

export type SupportedBrowser = z.infer<typeof supportedBrowserSchema>;
export type UnregisterBrowser = z.infer<typeof unregisterBrowserSchema>;

export type CliCommand =
	| { kind: "help" }
	| { kind: "extension-build"; outPath?: string }
	| {
			browser: SupportedBrowser;
			extensionId: string;
			kind: "native-register";
	  }
	| { browser: UnregisterBrowser; kind: "native-unregister" }
	| { kind: "mcp" }
	| { kind: "doctor" };

export function parseCommand(argv: string[]): CliCommand {
	if (argv.length === 0) {
		return { kind: "help" };
	}

	let parsedCommand: CliCommand | undefined;
	const program = createProgram((command) => {
		parsedCommand = command;
	});

	try {
		program.parse(["node", "atlas-browser-connect", ...argv], {
			from: "node",
		});
	} catch (error) {
		if (
			error instanceof CommanderError &&
			error.code === "commander.helpDisplayed"
		) {
			return { kind: "help" };
		}

		if (error instanceof CommanderError) {
			throw new Error(error.message);
		}

		throw error;
	}

	if (!parsedCommand) {
		return { kind: "help" };
	}

	return parsedCommand;
}

function createProgram(setCommand: (command: CliCommand) => void) {
	const program = new Command();

	program
		.name("atlas-browser-connect")
		.exitOverride()
		.configureOutput({
			writeErr: () => {},
			writeOut: () => {},
		});

	const extension = program.command("extension");
	extension
		.command("build")
		.option("--out <path>")
		.action((options: { out?: string }) => {
			setCommand({
				kind: "extension-build",
				outPath: options.out,
			});
		});

	const native = program.command("native");
	native
		.command("register")
		.option("--extension-id <id>")
		.option("--browser <browser>")
		.action((options: { browser?: string; extensionId?: string }) => {
			const extensionId = requireOption(
				options.extensionId,
				"native register requires --extension-id",
			);
			const browser = requireOption(
				options.browser,
				"native register requires --browser",
			);

			setCommand({
				browser: parseSupportedBrowser(browser),
				extensionId: parseExtensionId(extensionId),
				kind: "native-register",
			});
		});

	native
		.command("unregister")
		.option("--browser <browser>")
		.action((options: { browser?: string }) => {
			setCommand({
				browser: parseUnregisterBrowser(
					requireOption(
						options.browser,
						"native unregister requires --browser",
					),
				),
				kind: "native-unregister",
			});
		});

	program.command("mcp").action(() => {
		setCommand({ kind: "mcp" });
	});

	program.command("doctor").action(() => {
		setCommand({ kind: "doctor" });
	});

	return program;
}

function requireOption(value: string | undefined, message: string) {
	if (!value) {
		throw new Error(message);
	}

	return value;
}

function parseSupportedBrowser(value: string) {
	const result = supportedBrowserSchema.safeParse(value);

	if (!result.success) {
		throw new Error(
			`Unsupported browser: ${value}. Supported values: ${supportedBrowsers.join(", ")}.`,
		);
	}

	return result.data;
}

function parseUnregisterBrowser(value: string) {
	const result = unregisterBrowserSchema.safeParse(value);

	if (!result.success) {
		throw new Error(
			`Unsupported browser: ${value}. Supported values: ${supportedBrowsers.join(", ")}, all.`,
		);
	}

	return result.data;
}

function parseExtensionId(value: string) {
	const result = extensionIdSchema.safeParse(value);

	if (!result.success) {
		throw new Error(result.error.issues[0]?.message ?? "Invalid extension id.");
	}

	return result.data;
}
