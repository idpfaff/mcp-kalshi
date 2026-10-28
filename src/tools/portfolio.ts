import dedent from "dedent";
import { z } from "zod";
import {
	direction,
	money,
	pagination,
	quantity,
	sidePrice,
} from "../lib/format.js";
import { PortfolioService } from "../services/portfolio-service.js";

const portfolioService = new PortfolioService();

// GET_BALANCE tool
const getBalanceParams = z.object({});

export const getBalanceTool = {
	name: "GET_BALANCE",
	description:
		"Get the current account balance and portfolio value. Values are returned in dollars.",
	parameters: getBalanceParams,
	execute: async (_params: z.infer<typeof getBalanceParams>) => {
		try {
			const result = await portfolioService.getBalance();
			return dedent`
				Account Balance: ${money(result, "balance")}
				Portfolio Value: ${money(result, "portfolio_value")}
			`;
		} catch (error) {
			return `Error fetching balance: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

// GET_POSITIONS tool
const getPositionsParams = z.object({
	ticker: z.string().optional().describe("Filter by market ticker"),
	eventTicker: z
		.string()
		.optional()
		.describe("Filter by event ticker (comma-separated, max 10)"),
	limit: z
		.number()
		.min(1)
		.max(1000)
		.optional()
		.describe("Number of results (default 100)"),
	cursor: z.string().optional().describe("Pagination cursor"),
	countFilter: z
		.string()
		.optional()
		.describe(
			"Filter: 'position' for non-zero positions, 'total_traded' for traded",
		),
});

export const getPositionsTool = {
	name: "GET_POSITIONS",
	description:
		"Get your current portfolio positions showing market exposure, cost basis, and P&L for each position.",
	parameters: getPositionsParams,
	execute: async (params: z.infer<typeof getPositionsParams>) => {
		try {
			const result = await portfolioService.getPositions(params);
			const positions = result.market_positions || [];
			if (positions.length === 0) {
				return "No positions found.";
			}
			const summary = positions
				.map((p) => {
					return `• ${p.ticker}: ${quantity(p, "position")} contracts (Realized P&L: ${money(p, "realized_pnl")}; Exposure: ${money(p, "market_exposure")}; Fees: ${money(p, "fees_paid")})`;
				})
				.join("\n");
			return dedent`
				Found ${positions.length} positions:

				${summary}${pagination(result)}
			`;
		} catch (error) {
			return `Error fetching positions: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

// GET_FILLS tool
const getFillsParams = z.object({
	ticker: z.string().optional().describe("Filter by market ticker"),
	orderId: z.string().optional().describe("Filter by order ID"),
	limit: z
		.number()
		.min(1)
		.max(200)
		.optional()
		.describe("Number of results (1-200, default 100)"),
	cursor: z.string().optional().describe("Pagination cursor"),
	minTs: z
		.number()
		.optional()
		.describe("Filter fills after this Unix timestamp"),
	maxTs: z
		.number()
		.optional()
		.describe("Filter fills before this Unix timestamp"),
});

export const getFillsTool = {
	name: "GET_FILLS",
	description:
		"Get your trade fill history. A fill occurs when your order is matched with another trader.",
	parameters: getFillsParams,
	execute: async (params: z.infer<typeof getFillsParams>) => {
		try {
			const result = await portfolioService.getFills(params);
			const fills = result.fills || [];
			if (fills.length === 0) {
				return "No fills found.";
			}
			const summary = fills
				.map((f) => {
					const time = f.created_time
						? new Date(f.created_time).toLocaleString()
						: "N/A";
					const { side, action } = direction(f);
					return `• ${f.ticker}: ${action} ${quantity(f, "count")} ${side} @ ${sidePrice(f)} (${time})`;
				})
				.join("\n");
			return dedent`
				Found ${fills.length} fills:

				${summary}${pagination(result)}
			`;
		} catch (error) {
			return `Error fetching fills: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

// GET_SETTLEMENTS tool
const getSettlementsParams = z.object({
	ticker: z.string().optional().describe("Filter by market ticker"),
	eventTicker: z
		.string()
		.optional()
		.describe("Filter by event ticker (comma-separated, max 10)"),
	limit: z
		.number()
		.min(1)
		.max(200)
		.optional()
		.describe("Number of results (1-200, default 100)"),
	cursor: z.string().optional().describe("Pagination cursor"),
	minTs: z
		.number()
		.optional()
		.describe("Filter settlements after this Unix timestamp"),
	maxTs: z
		.number()
		.optional()
		.describe("Filter settlements before this Unix timestamp"),
});

export const getSettlementsTool = {
	name: "GET_SETTLEMENTS",
	description:
		"Get your settlement history showing resolved markets and their payouts.",
	parameters: getSettlementsParams,
	execute: async (params: z.infer<typeof getSettlementsParams>) => {
		try {
			const result = await portfolioService.getSettlements(params);
			const settlements = result.settlements || [];
			if (settlements.length === 0) {
				return "No settlements found.";
			}
			const summary = settlements
				.map((s) => {
					const time = s.settled_time
						? new Date(s.settled_time).toLocaleString()
						: "N/A";
					return `• ${s.ticker}: ${s.market_result} - Revenue: ${money(s, "revenue")} (${time})`;
				})
				.join("\n");
			return dedent`
				Found ${settlements.length} settlements:

				${summary}${pagination(result)}
			`;
		} catch (error) {
			return `Error fetching settlements: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

export const portfolioTools = [
	getBalanceTool,
	getPositionsTool,
	getFillsTool,
	getSettlementsTool,
];
