import {
	GetMarketCandlesticksPeriodIntervalEnum,
	type GetMarketsStatusEnum,
} from "kalshi-typescript";
import { KalshiClient } from "./kalshi-client.js";

export interface GetMarketsParams {
	limit?: number;
	cursor?: string;
	eventTicker?: string;
	seriesTicker?: string;
	minCreatedTs?: number;
	maxCreatedTs?: number;
	maxCloseTs?: number;
	minCloseTs?: number;
	minSettledTs?: number;
	maxSettledTs?: number;
	status?: GetMarketsStatusEnum;
	tickers?: string;
}

export interface GetMarketOrderbookParams {
	ticker: string;
	depth?: number;
}

export interface GetMarketCandlesticksParams {
	seriesTicker: string;
	marketTicker: string;
	startTs: number;
	endTs: number;
	periodInterval: 1 | 60 | 1440;
}

export interface GetTradesParams {
	limit?: number;
	cursor?: string;
	ticker?: string;
	minTs?: number;
	maxTs?: number;
}

export { GetMarketCandlesticksPeriodIntervalEnum };

export class MarketsService {
	private readonly client: KalshiClient;

	constructor() {
		this.client = KalshiClient.getInstance();
	}

	async getMarkets(params: GetMarketsParams = {}) {
		const response = await this.client.market.getMarkets(
			params.limit,
			params.cursor,
			params.eventTicker,
			params.seriesTicker,
			params.minCreatedTs,
			params.maxCreatedTs,
			params.maxCloseTs,
			params.minCloseTs,
			params.minSettledTs,
			params.maxSettledTs,
			params.status,
			params.tickers,
		);
		return response.data;
	}

	async getMarket(ticker: string) {
		const response = await this.client.market.getMarket(ticker);
		return response.data;
	}

	async getMarketOrderbook(params: GetMarketOrderbookParams) {
		const response = await this.client.market.getMarketOrderbook(
			params.ticker,
			params.depth,
		);
		return response.data;
	}

	async getMarketCandlesticks(params: GetMarketCandlesticksParams) {
		const response = await this.client.market.getMarketCandlesticks(
			params.seriesTicker,
			params.marketTicker,
			params.startTs,
			params.endTs,
			params.periodInterval,
		);
		return response.data;
	}

	async getTrades(params: GetTradesParams = {}) {
		const response = await this.client.market.getTrades(
			params.limit,
			params.cursor,
			params.ticker,
			params.minTs,
			params.maxTs,
		);
		return response.data;
	}

	async getSeries(seriesTicker: string) {
		const response = await this.client.market.getSeries(seriesTicker);
		return response.data;
	}

	async getSeriesList(category?: string, tags?: string) {
		const response = await this.client.market.getSeriesList(category, tags);
		return response.data;
	}
}
