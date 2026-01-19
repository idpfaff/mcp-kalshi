import { KalshiClient } from "./kalshi-client.js";

export interface GetFillsParams {
	ticker?: string;
	orderId?: string;
	minTs?: number;
	maxTs?: number;
	limit?: number;
	cursor?: string;
}

export interface GetPositionsParams {
	cursor?: string;
	limit?: number;
	countFilter?: string;
	ticker?: string;
	eventTicker?: string;
}

export interface GetSettlementsParams {
	limit?: number;
	cursor?: string;
	ticker?: string;
	eventTicker?: string;
	minTs?: number;
	maxTs?: number;
}

export class PortfolioService {
	private readonly client: KalshiClient;

	constructor() {
		this.client = KalshiClient.getInstance();
	}

	async getBalance() {
		const response = await this.client.portfolio.getBalance();
		return response.data;
	}

	async getPositions(params: GetPositionsParams = {}) {
		const response = await this.client.portfolio.getPositions(
			params.cursor,
			params.limit,
			params.countFilter,
			params.ticker,
			params.eventTicker,
		);
		return response.data;
	}

	async getFills(params: GetFillsParams = {}) {
		const response = await this.client.portfolio.getFills(
			params.ticker,
			params.orderId,
			params.minTs,
			params.maxTs,
			params.limit,
			params.cursor,
		);
		return response.data;
	}

	async getSettlements(params: GetSettlementsParams = {}) {
		const response = await this.client.portfolio.getSettlements(
			params.limit,
			params.cursor,
			params.ticker,
			params.eventTicker,
			params.minTs,
			params.maxTs,
		);
		return response.data;
	}

	async getRestingOrderTotalValue() {
		const response =
			await this.client.portfolio.getPortfolioRestingOrderTotalValue();
		return response.data;
	}
}
