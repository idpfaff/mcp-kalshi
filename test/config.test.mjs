import assert from "node:assert/strict";
import test from "node:test";
import { config, loadConfig } from "../dist/lib/config.js";
import { KalshiClient } from "../dist/services/kalshi-client.js";
import { OrdersService } from "../dist/services/orders-service.js";

test("read-only is the default and environments select official endpoints", () => {
	assert.equal(loadConfig({}).kalshi.readOnly, true);
	assert.equal(
		loadConfig({}).kalshi.basePath,
		"https://external-api.kalshi.com/trade-api/v2",
	);
	assert.equal(
		loadConfig({ KALSHI_ENV: "demo" }).kalshi.basePath,
		"https://external-api.demo.kalshi.co/trade-api/v2",
	);
	assert.equal(
		loadConfig({ KALSHI_READ_ONLY: "false" }).kalshi.readOnly,
		false,
	);
	assert.throws(() => loadConfig({ KALSHI_READ_ONLY: "FALSE" }));
	assert.throws(() => loadConfig({ KALSHI_ENV: "typo" }));
});
test("public SDK client starts without credentials", () => {
	assert.doesNotThrow(() => KalshiClient.getPublicInstance());
});
test("every order mutation rejects in read-only mode before accessing credentials", async () => {
	const previous = config.kalshi.readOnly;
	config.kalshi.readOnly = true;
	try {
		const service = new OrdersService();
		for (const [method, input] of [
			["createOrder", {}],
			["cancelOrder", "x"],
			["amendOrder", {}],
			["decreaseOrder", {}],
			["batchCreateOrders", { orders: [] }],
			["batchCancelOrders", { ids: [] }],
		]) {
			await assert.rejects(() => service[method](input), /Trading is disabled/);
		}
	} finally {
		config.kalshi.readOnly = previous;
	}
});
