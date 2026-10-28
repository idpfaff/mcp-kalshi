import type {
	AmendOrderRequestActionEnum,
	AmendOrderRequestSideEnum,
	CreateOrderRequest,
	CreateOrderRequestActionEnum,
	CreateOrderRequestSideEnum,
	CreateOrderRequestTimeInForceEnum,
	CreateOrderRequestTypeEnum,
} from "kalshi-typescript";
import { assertTradingEnabled } from "../lib/config.js";
import { KalshiClient } from "./kalshi-client.js";

export interface GetOrdersParams {
	ticker?: string;
	eventTicker?: string;
	minTs?: number;
	maxTs?: number;
	status?: string;
	limit?: number;
	cursor?: string;
}

export interface CreateOrderParams {
	ticker: string;
	side: CreateOrderRequestSideEnum;
	action: CreateOrderRequestActionEnum;
	count: number;
	type?: CreateOrderRequestTypeEnum;
	yesPrice?: number;
	noPrice?: number;
	clientOrderId?: string;
	expirationTs?: number;
	timeInForce?: CreateOrderRequestTimeInForceEnum;
	postOnly?: boolean;
	reduceOnly?: boolean;
}

export interface AmendOrderParams {
	orderId: string;
	ticker: string;
	side: AmendOrderRequestSideEnum;
	action: AmendOrderRequestActionEnum;
	clientOrderId: string;
	updatedClientOrderId: string;
	count?: number;
	yesPrice?: number;
	noPrice?: number;
}

export interface DecreaseOrderParams {
	orderId: string;
	reduceBy: number;
}

export interface BatchCreateOrdersParams {
	orders: CreateOrderParams[];
}

export interface BatchCancelOrdersParams {
	ids: string[];
}

export interface GetOrderQueuePositionsParams {
	marketTickers?: string;
	eventTicker?: string;
}

export class OrdersService {
	private get client(): KalshiClient {
		return KalshiClient.getInstance();
	}

	async getOrders(params: GetOrdersParams = {}) {
		const response = await this.client.orders.getOrders(
			params.ticker,
			params.eventTicker,
			params.minTs,
			params.maxTs,
			params.status,
			params.limit,
			params.cursor,
		);
		return response.data;
	}

	async getOrder(orderId: string) {
		const response = await this.client.orders.getOrder(orderId);
		return response.data;
	}

	async createOrder(params: CreateOrderParams) {
		assertTradingEnabled();
		const request: CreateOrderRequest = {
			ticker: params.ticker,
			side: params.side,
			action: params.action,
			count: params.count,
			type: params.type,
			yes_price: params.yesPrice,
			no_price: params.noPrice,
			client_order_id: params.clientOrderId,
			expiration_ts: params.expirationTs,
			time_in_force: params.timeInForce,
			post_only: params.postOnly,
			reduce_only: params.reduceOnly,
		};
		const response = await this.client.orders.createOrder(request);
		return response.data;
	}

	async cancelOrder(orderId: string) {
		assertTradingEnabled();
		const response = await this.client.orders.cancelOrder(orderId);
		return response.data;
	}

	async amendOrder(params: AmendOrderParams) {
		assertTradingEnabled();
		const response = await this.client.orders.amendOrder(params.orderId, {
			ticker: params.ticker,
			side: params.side,
			action: params.action,
			client_order_id: params.clientOrderId,
			updated_client_order_id: params.updatedClientOrderId,
			count: params.count,
			yes_price: params.yesPrice,
			no_price: params.noPrice,
		});
		return response.data;
	}

	async decreaseOrder(params: DecreaseOrderParams) {
		assertTradingEnabled();
		const response = await this.client.orders.decreaseOrder(params.orderId, {
			reduce_by: params.reduceBy,
		});
		return response.data;
	}

	async batchCreateOrders(params: BatchCreateOrdersParams) {
		assertTradingEnabled();
		const orders = params.orders.map((order) => ({
			ticker: order.ticker,
			side: order.side,
			action: order.action,
			count: order.count,
			type: order.type,
			yes_price: order.yesPrice,
			no_price: order.noPrice,
			client_order_id: order.clientOrderId,
			expiration_ts: order.expirationTs,
			time_in_force: order.timeInForce,
			post_only: order.postOnly,
			reduce_only: order.reduceOnly,
		}));
		const response = await this.client.orders.batchCreateOrders({ orders });
		return response.data;
	}

	async batchCancelOrders(params: BatchCancelOrdersParams) {
		assertTradingEnabled();
		const response = await this.client.orders.batchCancelOrders({
			ids: params.ids,
		});
		return response.data;
	}

	async getOrderQueuePosition(orderId: string) {
		const response = await this.client.orders.getOrderQueuePosition(orderId);
		return response.data;
	}

	async getOrderQueuePositions(params: GetOrderQueuePositionsParams = {}) {
		const response = await this.client.orders.getOrderQueuePositions(
			params.marketTickers,
			params.eventTicker,
		);
		return response.data;
	}
}
