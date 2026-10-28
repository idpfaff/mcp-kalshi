import dedent from "dedent";
import { z } from "zod";
import {
	direction,
	field,
	pagination,
	quantity,
	sidePrice,
} from "../lib/format.js";
import { OrdersService } from "../services/orders-service.js";

const ordersService = new OrdersService();

// GET_ORDERS tool
const getOrdersParams = z.object({
	ticker: z.string().optional().describe("Filter by market ticker"),
	eventTicker: z
		.string()
		.optional()
		.describe("Filter by event ticker (comma-separated, max 10)"),
	status: z
		.enum(["resting", "canceled", "executed"])
		.optional()
		.describe("Filter by order status"),
	limit: z
		.number()
		.min(1)
		.max(200)
		.optional()
		.describe("Number of results (1-200, default 100)"),
	cursor: z.string().optional().describe("Pagination cursor"),
});

export const getOrdersTool = {
	name: "GET_ORDERS",
	description:
		"Get your orders with optional filtering by market, status, or time range.",
	parameters: getOrdersParams,
	execute: async (params: z.infer<typeof getOrdersParams>) => {
		try {
			const result = await ordersService.getOrders(params);
			const orders = result.orders || [];
			if (orders.length === 0) {
				return "No orders found.";
			}
			const summary = orders
				.map((o) => {
					const { side, action } = direction(o);
					return `• ${o.order_id} ${o.ticker}: ${action} ${quantity(o, "remaining_count")}/${quantity(o, "initial_count")} ${side} @ ${sidePrice(o)} [${o.status}]`;
				})
				.join("\n");
			return dedent`
				Found ${orders.length} orders:

				${summary}${pagination(result)}
			`;
		} catch (error) {
			return `Error fetching orders: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

// GET_ORDER tool
const getOrderParams = z.object({
	orderId: z.string().min(1).describe("The order ID"),
});

export const getOrderTool = {
	name: "GET_ORDER",
	description: "Get detailed information about a specific order by its ID.",
	parameters: getOrderParams,
	execute: async (params: z.infer<typeof getOrderParams>) => {
		try {
			const result = await ordersService.getOrder(params.orderId);
			const o = result.order;
			if (!o) {
				return `Order '${params.orderId}' not found.`;
			}
			const { side, action } = direction(o);
			return dedent`
				Order: ${o.order_id}
				Market: ${o.ticker}
				Type: ${action} ${side}
				Status: ${o.status}

				Quantity:
				• Initial: ${quantity(o, "initial_count")} contracts
				• Filled: ${quantity(o, "fill_count")} contracts
				• Remaining: ${quantity(o, "remaining_count")} contracts

				Price: ${sidePrice(o)}
				Queue Position: ${field(o, "queue_position") ?? "N/A"}

				Created: ${o.created_time}
				Last Updated: ${o.last_update_time}
			`;
		} catch (error) {
			return `Error fetching order: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

// CREATE_ORDER tool
const createOrderParams = z.object({
	ticker: z.string().min(1).describe("Market ticker to trade"),
	side: z.enum(["yes", "no"]).describe("Side to trade: 'yes' or 'no'"),
	action: z.enum(["buy", "sell"]).describe("Action: 'buy' or 'sell'"),
	count: z.number().min(1).describe("Number of contracts"),
	type: z
		.enum(["limit", "market"])
		.optional()
		.default("limit")
		.describe("Order type (default: limit)"),
	yesPrice: z
		.number()
		.min(1)
		.max(99)
		.optional()
		.describe(
			"Yes price in cents (1-99) - required for limit orders on yes side",
		),
	noPrice: z
		.number()
		.min(1)
		.max(99)
		.optional()
		.describe(
			"No price in cents (1-99) - required for limit orders on no side",
		),
	timeInForce: z
		.enum(["fill_or_kill", "good_till_canceled", "immediate_or_cancel"])
		.optional()
		.describe("Time in force (default: good_till_canceled)"),
	postOnly: z
		.boolean()
		.optional()
		.describe("If true, order will only be placed if it will rest on the book"),
	reduceOnly: z
		.boolean()
		.optional()
		.describe("If true, order will only reduce existing position"),
});

export const createOrderTool = {
	name: "CREATE_ORDER",
	description:
		"Create a new order to buy or sell contracts in a prediction market. Use limit orders with a price, or market orders for immediate execution.",
	parameters: createOrderParams,
	execute: async (params: z.infer<typeof createOrderParams>) => {
		try {
			const result = await ordersService.createOrder({
				ticker: params.ticker,
				side: params.side,
				action: params.action,
				count: params.count,
				type: params.type,
				yesPrice: params.yesPrice,
				noPrice: params.noPrice,
				timeInForce: params.timeInForce,
				postOnly: params.postOnly,
				reduceOnly: params.reduceOnly,
			});
			const o = result.order;
			if (!o) {
				return "Order created but no details returned.";
			}
			const { side, action } = direction(o);
			return dedent`
				✅ Order created successfully!

				Order ID: ${o.order_id}
				Market: ${o.ticker}
				Type: ${action} ${quantity(o, "initial_count")} ${side} @ ${sidePrice(o)}
				Status: ${o.status}
				Filled: ${quantity(o, "fill_count")}/${quantity(o, "initial_count")} contracts
			`;
		} catch (error) {
			return `Error creating order: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

// CANCEL_ORDER tool
const cancelOrderParams = z.object({
	orderId: z.string().min(1).describe("The order ID to cancel"),
});

export const cancelOrderTool = {
	name: "CANCEL_ORDER",
	description: "Cancel an existing open order by its ID.",
	parameters: cancelOrderParams,
	execute: async (params: z.infer<typeof cancelOrderParams>) => {
		try {
			const result = await ordersService.cancelOrder(params.orderId);
			const o = result.order;
			return dedent`
				✅ Order canceled successfully!

				Order ID: ${o?.order_id || params.orderId}
				Final Status: ${o?.status || "canceled"}
				Filled before cancel: ${o ? quantity(o, "fill_count") : "N/A"} contracts
			`;
		} catch (error) {
			return `Error canceling order: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

// BATCH_CANCEL_ORDERS tool
const batchCancelOrdersParams = z.object({
	ids: z
		.array(z.string())
		.min(1)
		.max(20)
		.describe("Array of order IDs to cancel (max 20)"),
});

export const batchCancelOrdersTool = {
	name: "BATCH_CANCEL_ORDERS",
	description: "Cancel multiple orders at once (up to 20 orders per batch).",
	parameters: batchCancelOrdersParams,
	execute: async (params: z.infer<typeof batchCancelOrdersParams>) => {
		try {
			const result = await ordersService.batchCancelOrders({ ids: params.ids });
			const canceled = result.orders?.length || 0;
			return dedent`
				✅ Batch cancel completed!

				Canceled: ${canceled} orders
			`;
		} catch (error) {
			return `Error canceling orders: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

// DECREASE_ORDER tool
const decreaseOrderParams = z.object({
	orderId: z.string().min(1).describe("The order ID to decrease"),
	reduceBy: z.number().min(1).describe("Number of contracts to reduce by"),
});

export const decreaseOrderTool = {
	name: "DECREASE_ORDER",
	description:
		"Decrease the quantity of an existing order. This is the only way to reduce order size without fully canceling.",
	parameters: decreaseOrderParams,
	execute: async (params: z.infer<typeof decreaseOrderParams>) => {
		try {
			const result = await ordersService.decreaseOrder({
				orderId: params.orderId,
				reduceBy: params.reduceBy,
			});
			const o = result.order;
			return dedent`
				✅ Order decreased successfully!

				Order ID: ${o?.order_id || params.orderId}
				Remaining: ${o ? quantity(o, "remaining_count") : "N/A"} contracts
				Status: ${o?.status || "updated"}
			`;
		} catch (error) {
			return `Error decreasing order: ${error instanceof Error ? error.message : String(error)}`;
		}
	},
} as const;

export const orderTools = [
	getOrdersTool,
	getOrderTool,
	createOrderTool,
	cancelOrderTool,
	batchCancelOrdersTool,
	decreaseOrderTool,
];
