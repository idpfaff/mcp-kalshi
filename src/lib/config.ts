export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
	const environment = env.KALSHI_ENV || "production";
	if (environment !== "production" && environment !== "demo") {
		throw new Error("KALSHI_ENV must be production or demo.");
	}
	const readOnly = env.KALSHI_READ_ONLY ?? "true";
	if (readOnly !== "true" && readOnly !== "false") {
		throw new Error("KALSHI_READ_ONLY must be true or false.");
	}
	return {
		kalshi: {
			basePath:
				environment === "demo"
					? "https://external-api.demo.kalshi.co/trade-api/v2"
					: "https://external-api.kalshi.com/trade-api/v2",
			environment,
			readOnly: readOnly === "true",
			apiKey: env.KALSHI_API_KEY || "",
			// Provide either privateKeyPath OR privateKeyPem
			privateKeyPath: env.KALSHI_PRIVATE_KEY_PATH || "",
			privateKeyPem: env.KALSHI_PRIVATE_KEY_PEM || "",
		},
	};
}

export const config = loadConfig();

export function assertTradingEnabled() {
	if (config.kalshi.readOnly) {
		throw new Error(
			"Trading is disabled. Set KALSHI_READ_ONLY=false explicitly to enable order changes.",
		);
	}
}
