import assert from "node:assert/strict";
// This check deliberately uses only public endpoints, with no account credentials.
process.env.KALSHI_READ_ONLY = "true";
process.env.KALSHI_ENV = "production";
process.env.KALSHI_API_KEY = "";
process.env.KALSHI_PRIVATE_KEY_PATH = "";
process.env.KALSHI_PRIVATE_KEY_PEM = "";
const { MarketsService } = await import("../dist/services/markets-service.js");
const { getMarketsTool, getMarketTool, getMarketOrderbookTool } = await import(
	"../dist/tools/markets.js"
);
try {
	const service = new MarketsService();
	const response = await service.getMarkets({ limit: 1, status: "open" });
	assert.ok(
		response.markets?.length,
		"Expected at least one public open market",
	);
	const ticker = response.markets[0].ticker;
	for (const [name, tool, args] of [
		["list", getMarketsTool, { limit: 1 }],
		["detail", getMarketTool, { ticker }],
		["orderbook", getMarketOrderbookTool, { ticker, depth: 1 }],
	]) {
		const text = await tool.execute(args);
		assert.doesNotMatch(text, /Error fetching|undefined|NaN|No orderbook data/);
		if (name === "detail") {
			assert.match(text, /Yes Ask: \$/);
			assert.match(text, /Primary Rules:/);
		}
		console.log(`${name}: PASS`);
	}
	console.log(
		"Public market checks passed; no account credentials or order actions used.",
	);
} catch (error) {
	// HTTP errors may contain full request configuration; log only the message.
	console.error(
		`Live check failed: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exitCode = 1;
}
