import {
	CommunicationsApi,
	Configuration,
	EventsApi,
	ExchangeApi,
	MarketApi,
	OrdersApi,
	PortfolioApi,
} from "kalshi-typescript";
import { config } from "../lib/config.js";

let clientInstance: KalshiClient | null = null;
let publicClientInstance: KalshiClient | null = null;

export class KalshiClient {
	private readonly configuration: Configuration;
	public readonly portfolio: PortfolioApi;
	public readonly market: MarketApi;
	public readonly events: EventsApi;
	public readonly communications: CommunicationsApi;
	public readonly exchange: ExchangeApi;
	public readonly orders: OrdersApi;

	constructor(publicOnly = false) {
		const { apiKey, privateKeyPath, privateKeyPem, basePath } = config.kalshi;

		if (!publicOnly && !apiKey) {
			throw new Error(
				"KALSHI_API_KEY is not configured. Set it in your environment variables.",
			);
		}

		if (!publicOnly && !privateKeyPath && !privateKeyPem) {
			throw new Error(
				"Kalshi private key is not configured. Set KALSHI_PRIVATE_KEY_PATH or KALSHI_PRIVATE_KEY_PEM in your environment variables.",
			);
		}

		// Configure SDK with either file path or PEM string
		const configOptions: ConstructorParameters<typeof Configuration>[0] = {
			basePath,
			// Use Node's fetch transport consistently, including its proxy handling.
			baseOptions: { timeout: 20000, adapter: "fetch" },
		};

		if (!publicOnly) configOptions.apiKey = apiKey;
		if (!publicOnly && privateKeyPem) {
			configOptions.privateKeyPem = privateKeyPem;
		} else if (!publicOnly && privateKeyPath) {
			configOptions.privateKeyPath = privateKeyPath;
		}

		this.configuration = new Configuration(configOptions);

		// Initialize all API instances
		this.portfolio = new PortfolioApi(this.configuration);
		this.market = new MarketApi(this.configuration);
		this.events = new EventsApi(this.configuration);
		this.communications = new CommunicationsApi(this.configuration);
		this.exchange = new ExchangeApi(this.configuration);
		this.orders = new OrdersApi(this.configuration);
	}

	static getInstance(): KalshiClient {
		if (!clientInstance) {
			clientInstance = new KalshiClient();
		}
		return clientInstance;
	}

	static getPublicInstance(): KalshiClient {
		if (!publicClientInstance) publicClientInstance = new KalshiClient(true);
		return publicClientInstance;
	}

	static isConfigured(): boolean {
		const { apiKey, privateKeyPath, privateKeyPem } = config.kalshi;
		return Boolean(apiKey && (privateKeyPath || privateKeyPem));
	}
}
