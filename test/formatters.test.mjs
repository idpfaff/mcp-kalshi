import assert from "node:assert/strict";
import test from "node:test";
import {
	direction,
	dollars,
	money,
	quantity,
	sidePrice,
} from "../dist/lib/format.js";
import { MarketsService } from "../dist/services/markets-service.js";
import { OrdersService } from "../dist/services/orders-service.js";
import { PortfolioService } from "../dist/services/portfolio-service.js";
import {
	getMarketOrderbookTool,
	getMarketTool,
	getMarketsTool,
	getSeriesTool,
	getTradesTool,
} from "../dist/tools/markets.js";
import { getOrderTool, getOrdersTool } from "../dist/tools/orders.js";
import {
	getBalanceTool,
	getFillsTool,
	getPositionsTool,
} from "../dist/tools/portfolio.js";

test("dollar prices remain dollars, with zero and sub-cent precision", () => {
	assert.equal(dollars("0.6500"), "$0.65");
	assert.equal(dollars("0.0001"), "$0.0001");
	assert.equal(dollars("0.0000"), "$0.00");
	assert.equal(dollars("-12.3400"), "-$12.34");
	assert.equal(dollars(undefined, 65), "$0.65");
	assert.equal(dollars(undefined, -1), "-$0.01");
	assert.equal(dollars(undefined, 0), "$0.00");
	assert.equal(dollars("bad", 65), "N/A");
	assert.equal(money({}, "realized_pnl"), "N/A");
	assert.equal(
		money(
			{ realized_pnl_dollars: "0.0000", realized_pnl: 100 },
			"realized_pnl",
		),
		"$0.00",
	);
	assert.equal(
		quantity({ position_fp: "9007199254740993.25" }, "position"),
		"9007199254740993.25",
	);
});

const market = {
	ticker: "TEST",
	title: "Fixture market",
	status: "active",
	yes_ask_dollars: "0.6500",
	yes_bid_dollars: "0.6400",
	no_ask_dollars: "0.3600",
	no_bid_dollars: "0.3500",
	volume_fp: "100.25",
	open_interest_fp: "10.00",
	last_price_dollars: "0.6450",
	event_ticker: "TESTEVENT",
	close_time: "2026-10-28T12:00:00Z",
	rules_primary: "Fixture settlement condition",
	rules_secondary: "Fixture exception",
};

test("market list fixes the 100x unit error and fractional volume", async (t) => {
	t.mock.method(MarketsService.prototype, "getMarkets", async () => ({
		markets: [market],
		cursor: "NEXT",
	}));
	const text = await getMarketsTool.execute({ limit: 1 });
	assert.match(text, /Yes Ask: \$0\.65/);
	assert.match(text, /Volume: 100\.25/);
	assert.match(text, /NEXT/);
	assert.doesNotMatch(text, /¢|undefined/);
});
test("market detail includes current prices, counts, and settlement rules", async (t) => {
	t.mock.method(MarketsService.prototype, "getMarket", async () => ({
		market,
	}));
	const text = await getMarketTool.execute({ ticker: "TEST" });
	for (const expected of [
		"$0.65",
		"$0.645",
		"100.25 contracts",
		"10.00 contracts",
		market.rules_primary,
		market.rules_secondary,
	])
		assert.ok(text.includes(expected), expected);
	assert.doesNotMatch(text, /undefined/);
});
for (const [name, book] of [
	[
		"fixed point",
		{
			orderbook_fp: {
				yes_dollars: [["0.6400", "100.25"]],
				no_dollars: [["0.3500", "50.00"]],
			},
		},
	],
	["legacy", { orderbook: { yes: [[64, 100]], no: [[35, 50]] } }],
])
	test(`${name} order books preserve populated sides`, async (t) => {
		t.mock.method(
			MarketsService.prototype,
			"getMarketOrderbook",
			async () => book,
		);
		const text = await getMarketOrderbookTool.execute({ ticker: "TEST" });
		assert.match(text, /\$0\.64: 100/);
		assert.match(text, /\$0\.35: 50/);
		assert.doesNotMatch(text, /No orderbook|No orders/);
	});
test("unknown orderbook schema is an error, not an empty book", async (t) => {
	t.mock.method(MarketsService.prototype, "getMarketOrderbook", async () => ({
		orderbook: { wrong: [] },
	}));
	assert.match(
		await getMarketOrderbookTool.execute({ ticker: "TEST" }),
		/Unrecognized orderbook/,
	);
});
test("genuinely empty book displays empty sides", async (t) => {
	t.mock.method(MarketsService.prototype, "getMarketOrderbook", async () => ({
		orderbook_fp: { yes_dollars: [], no_dollars: [] },
	}));
	assert.match(
		await getMarketOrderbookTool.execute({ ticker: "TEST" }),
		/YES Bids: No orders/,
	);
});
test("public trades retain fractional quantity and next-page cursor", async (t) => {
	t.mock.method(MarketsService.prototype, "getTrades", async () => ({
		trades: [{ ticker: "TEST", count_fp: "0.25", yes_price_dollars: "0.0065" }],
		cursor: "TRADES_NEXT",
	}));
	const text = await getTradesTool.execute({});
	assert.match(text, /0\.25 contracts @ Yes \$0\.0065/);
	assert.match(text, /TRADES_NEXT/);
});
test("settlement sources are readable objects", async (t) => {
	t.mock.method(MarketsService.prototype, "getSeries", async () => ({
		series: {
			ticker: "TEST",
			title: "Test",
			category: "Test",
			settlement_sources: [{ name: "Agency", url: "https://example.com" }],
		},
	}));
	assert.match(
		await getSeriesTool.execute({ seriesTicker: "TEST" }),
		/Agency: https:\/\/example\.com/,
	);
});
test("positions preserve P&L, negative fractional positions, and pagination", async (t) => {
	t.mock.method(PortfolioService.prototype, "getPositions", async () => ({
		market_positions: [
			{
				ticker: "TEST",
				position_fp: "-5.25",
				realized_pnl_dollars: "12.3400",
				market_exposure_dollars: "2.5000",
				fees_paid_dollars: "0.0100",
			},
		],
		cursor: "POSITIONS_NEXT",
	}));
	const text = await getPositionsTool.execute({});
	for (const expected of [
		"-5.25 contracts",
		"$12.34",
		"$2.50",
		"$0.01",
		"POSITIONS_NEXT",
	])
		assert.ok(text.includes(expected), expected);
	assert.doesNotMatch(text, /undefined/);
});
test("missing balance is not manufactured as zero", async (t) => {
	t.mock.method(PortfolioService.prototype, "getBalance", async () => ({
		portfolio_value: 0,
	}));
	const text = await getBalanceTool.execute({});
	assert.match(text, /Account Balance: N\/A/);
	assert.match(text, /Portfolio Value: \$0\.00/);
});
test("canonical direction is exposure, not an invented buy/sell action", () => {
	assert.deepEqual(
		direction({
			outcome_side: "yes",
			book_side: "bid",
			side: "no",
			action: "sell",
		}),
		{ side: "YES", action: "EXPOSURE" },
	);
	assert.deepEqual(direction({ outcome_side: "no", book_side: "ask" }), {
		side: "NO",
		action: "EXPOSURE",
	});
	assert.equal(
		sidePrice({
			outcome_side: "no",
			yes_price_dollars: "0.65",
			no_price_dollars: "0.35",
		}),
		"$0.65 (YES price)",
	);
	assert.equal(
		sidePrice({ side: "no", action: "buy", yes_price: 65, no_price: 35 }),
		"$0.35",
	);
});
test("fills use canonical exposure and explicit YES price", async (t) => {
	t.mock.method(PortfolioService.prototype, "getFills", async () => ({
		fills: [
			{
				ticker: "TEST",
				outcome_side: "no",
				book_side: "ask",
				count_fp: "0.50",
				yes_price_dollars: "0.65",
			},
		],
	}));
	assert.match(
		await getFillsTool.execute({}),
		/EXPOSURE 0\.50 NO @ \$0\.65 \(YES price\)/,
	);
});
test("orders retain full IDs, zero remaining quantity and queue position", async (t) => {
	const order = {
		order_id: "full-order-id",
		ticker: "TEST",
		outcome_side: "no",
		yes_price_dollars: "0.65",
		remaining_count_fp: "0.00",
		initial_count_fp: "5.25",
		fill_count_fp: "5.25",
		queue_position: 0,
		status: "executed",
	};
	t.mock.method(OrdersService.prototype, "getOrders", async () => ({
		orders: [order],
		cursor: "ORDERS_NEXT",
	}));
	t.mock.method(OrdersService.prototype, "getOrder", async () => ({ order }));
	const list = await getOrdersTool.execute({});
	assert.match(list, /full-order-id/);
	assert.match(list, /0\.00\/5\.25/);
	assert.match(list, /ORDERS_NEXT/);
	const detail = await getOrderTool.execute({ orderId: order.order_id });
	assert.match(detail, /Remaining: 0\.00/);
	assert.match(detail, /Queue Position: 0/);
});
