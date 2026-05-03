import { nativeHostDescription, nativeHostName } from "./constants";

type NativeHostManifestOptions = {
	extensionId: string;
	hostPath: string;
};

export function createNativeHostManifest({
	extensionId,
	hostPath,
}: NativeHostManifestOptions) {
	return {
		allowed_origins: [`chrome-extension://${extensionId}/`],
		description: nativeHostDescription,
		name: nativeHostName,
		path: hostPath,
		type: "stdio",
	};
}
