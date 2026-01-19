export const config = {
	kalshi: {
		basePath: "https://api.elections.kalshi.com/trade-api/v2",
		apiKey: process.env.KALSHI_API_KEY || "",
		// Provide either privateKeyPath OR privateKeyPem
		privateKeyPath: process.env.KALSHI_PRIVATE_KEY_PATH || "",
		privateKeyPem: process.env.KALSHI_PRIVATE_KEY_PEM || "",
	},
};
