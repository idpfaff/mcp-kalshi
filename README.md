# Kalshi MCP — data compatibility fork

An unofficial local MCP server based on [BrainDAO/mcp-kalshi](https://github.com/BrainDAO/mcp-kalshi), upstream commit `15c12b37ed9f1b0e3fc0000e4918e9191c2b282b`. This fork corrects data formatting for Kalshi's current API and starts in read-only mode.

The data fixes are covered by automated tests. Authenticated account calls and order execution have not been verified against a Kalshi account. The inherited order-writing adapter still uses the legacy API; see [Trading status](#trading-status).

## What changed

- Dollar prices stay in dollars: `"0.6500"` displays as `$0.65`, rather than `0.6500¢`. Sub-cent precision is preserved.
- Fixed-point quantities, portfolio exposure and realized P&L use the current `_fp` and `_dollars` fields, with legacy fallbacks. Missing values display as `N/A` rather than invented zeroes.
- Order books recognize `orderbook_fp.yes_dollars/no_dollars` and legacy `orderbook.yes/no`. An unknown schema reports an error instead of an empty market.
- Market detail includes settlement rules. Order IDs and pagination cursors remain intact.
- Canonical order/fill direction is labeled as exposure, with its YES price explicitly identified. Canonical `bid`/`ask` cannot recover the old buy/sell action.
- Public market tools work without credentials, using a separate unsigned client.
- Read-only mode hides all four mutation tools and rejects mutations at the service layer. Demo and production use separate official endpoints.
- Regression tests cover formatting, read-only enforcement and the MCP stdio handshake. CI runs the build, tests and lint.

## Build and run this fork

Use Node.js 22 or newer and pnpm 9.15.9. Clone your fork, then run:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm build
pnpm start
```

The server uses **stdio** and is intended to be launched by an MCP client. Running `npx @iqai/mcp-kalshi` installs the upstream release, which does not contain these changes. This fork is marked `private` to prevent accidental publication under the upstream npm name.

## MCP client configuration

Use the absolute path to the built fork. Public market data needs no Kalshi account credentials:

```json
{
  "mcpServers": {
    "kalshi": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-kalshi/dist/index.js"],
      "env": {
        "KALSHI_ENV": "production",
        "KALSHI_READ_ONLY": "true"
      }
    }
  }
}
```

For private portfolio/order reads, add `KALSHI_API_KEY` and either `KALSHI_PRIVATE_KEY_PATH` (an absolute path) or `KALSHI_PRIVATE_KEY_PEM`. Keep `KALSHI_READ_ONLY=true`. Restart the MCP server after changing configuration.

| Variable | Default | Meaning |
| --- | --- | --- |
| `KALSHI_ENV` | `production` | Exactly `production` or `demo`. |
| `KALSHI_READ_ONLY` | `true` | Exactly `true` or `false`; `false` explicitly exposes the inherited order mutations. |
| `KALSHI_API_KEY` | unset | API key ID, needed only for private account operations. |
| `KALSHI_PRIVATE_KEY_PATH` | unset | RSA private key file, needed for private operations if no PEM string is supplied. |
| `KALSHI_PRIVATE_KEY_PEM` | unset | Alternative RSA private key text; takes precedence over the path. |

Production uses `https://external-api.kalshi.com/trade-api/v2`; demo uses `https://external-api.demo.kalshi.co/trade-api/v2`. Credentials are separate for the two environments. The endpoint is not an arbitrary user-provided URL. See [Kalshi API environments](https://docs.kalshi.com/getting_started/api_environments).

Private keys are used locally by the SDK to sign account requests. Public requests do not load or attach them. Key files and local environment files are ignored by git; keep credentials out of source and documentation.

## Available tools

The default configuration exposes 11 read tools:

| Access | Tools |
| --- | --- |
| Public, no credentials | `GET_MARKETS`, `GET_MARKET`, `GET_MARKET_ORDERBOOK`, `GET_TRADES`, `GET_SERIES` |
| Private account credentials | `GET_BALANCE`, `GET_POSITIONS`, `GET_FILLS`, `GET_SETTLEMENTS`, `GET_ORDERS`, `GET_ORDER` |

`KALSHI_READ_ONLY=false` additionally exposes `CREATE_ORDER`, `CANCEL_ORDER`, `DECREASE_ORDER`, and `BATCH_CANCEL_ORDERS`. Read the trading limitation below before enabling them.

## Trading status

This patch repairs the observed read/formatting defects. It does **not** migrate the inherited order-writing SDK adapter to Kalshi's [V2 order API](https://docs.kalshi.com/api-reference/orders/create-order-v2), which uses `/portfolio/events/orders`, `bid`/`ask`, and string dollar prices/quantities. The legacy create-order endpoint is marked for deprecation in the official docs.

The retained mutation tools use the upstream yes/no, buy/sell and cent-price interface. Their current server compatibility is unverified. Migration and authenticated demo testing are still required before relying on them for trading. Changing `KALSHI_ENV=demo` selects the demo endpoint; it does not itself verify that orders work. No account credentials or transactions are used by the automated checks.

## Development and validation

```bash
pnpm test       # build + fixture/configuration/MCP protocol regressions
pnpm lint       # Biome checks
pnpm test:live  # optional: real public market list, detail and orderbook reads
pnpm watch     # TypeScript watch mode
```

The live check clears account credentials and forces read-only production requests. It requires network access and fails if the upstream API is unavailable. Fixture tests exercise current and legacy payloads; they do not prove authenticated endpoint compatibility. CI runs the deterministic tests only.

Tool reference regeneration:

```bash
pnpm exec tsx .github/actions/generate-mcp-tools/generate-tools.mjs
```

## Upstream license status

The upstream README advertises MIT, but the reviewed commit and npm 0.1.1 package do not include a `LICENSE` file or package license field. This fork preserves that provenance and does not invent a license grant on the upstream authors' behalf. License clarification remains unresolved.

## API references

- [Fixed-point migration](https://docs.kalshi.com/getting_started/fixed_point_migration)
- [Order direction](https://docs.kalshi.com/getting_started/order_direction)
- [Orderbook schema](https://docs.kalshi.com/api-reference/market/get-market-orderbook)
- [Model Context Protocol](https://modelcontextprotocol.io)

## Tool parameter reference

Mutation entries below are only registered when read-only mode is explicitly disabled.

<!-- AUTO-GENERATED TOOLS START -->

### `BATCH_CANCEL_ORDERS`
Cancel multiple orders at once (up to 20 orders per batch).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | array | ✅ | Array of order IDs to cancel (max 20) |

### `CANCEL_ORDER`
Cancel an existing open order by its ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | ✅ | The order ID to cancel |

### `CREATE_ORDER`
Create a new order to buy or sell contracts in a prediction market. Use limit orders with a price, or market orders for immediate execution.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ticker` | string | ✅ |  | Market ticker to trade |
| `side` | string | ✅ |  | Side to trade: 'yes' or 'no' |
| `action` | string | ✅ |  | Action: 'buy' or 'sell' |
| `count` | number | ✅ |  | Number of contracts |
| `type` | string |  | "limit" | Order type (default: limit) |
| `yesPrice` | number |  |  | Yes price in cents (1-99) - required for limit orders on yes side |
| `noPrice` | number |  |  | No price in cents (1-99) - required for limit orders on no side |
| `timeInForce` | string |  |  | Time in force (default: good_till_canceled) |
| `postOnly` | boolean |  |  | If true, order will only be placed if it will rest on the book |
| `reduceOnly` | boolean |  |  | If true, order will only reduce existing position |

### `DECREASE_ORDER`
Decrease the quantity of an existing order. This is the only way to reduce order size without fully canceling.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | ✅ | The order ID to decrease |
| `reduceBy` | number | ✅ | Number of contracts to reduce by |

### `GET_BALANCE`
Get the current account balance and portfolio value. Values are returned in dollars.

_No parameters_

### `GET_FILLS`
Get your trade fill history. A fill occurs when your order is matched with another trader.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string |  | Filter by market ticker |
| `orderId` | string |  | Filter by order ID |
| `limit` | number |  | Number of results (1-200, default 100) |
| `cursor` | string |  | Pagination cursor |
| `minTs` | number |  | Filter fills after this Unix timestamp |
| `maxTs` | number |  | Filter fills before this Unix timestamp |

### `GET_MARKET`
Get detailed information about a specific prediction market by its ticker, including current prices, volume, open interest, and settlement rules.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | ✅ | The market ticker (e.g., 'INXD-25JAN20') |

### `GET_MARKET_ORDERBOOK`
Get the current orderbook for a market showing bid prices and quantities for both Yes and No sides.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | ✅ | The market ticker |
| `depth` | number |  | Depth of orderbook to retrieve (1-100, default 10) |

### `GET_MARKETS`
List and discover prediction markets on Kalshi. Markets represent binary outcomes users can trade on. Returns paginated results with market details including ticker, title, prices, and volume.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number |  | Number of results per page (1-1000, default 100) |
| `cursor` | string |  | Pagination cursor from previous response |
| `eventTicker` | string |  | Filter by event ticker (comma-separated, max 10) |
| `seriesTicker` | string |  | Filter by series ticker |
| `status` | string |  | Filter by market status |
| `tickers` | string |  | Filter by specific market tickers (comma-separated) |

### `GET_ORDER`
Get detailed information about a specific order by its ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | ✅ | The order ID |

### `GET_ORDERS`
Get your orders with optional filtering by market, status, or time range.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string |  | Filter by market ticker |
| `eventTicker` | string |  | Filter by event ticker (comma-separated, max 10) |
| `status` | string |  | Filter by order status |
| `limit` | number |  | Number of results (1-200, default 100) |
| `cursor` | string |  | Pagination cursor |

### `GET_POSITIONS`
Get your current portfolio positions showing market exposure, cost basis, and P&L for each position.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string |  | Filter by market ticker |
| `eventTicker` | string |  | Filter by event ticker (comma-separated, max 10) |
| `limit` | number |  | Number of results (default 100) |
| `cursor` | string |  | Pagination cursor |
| `countFilter` | string |  | Filter: 'position' for non-zero positions, 'total_traded' for traded |

### `GET_SERIES`
Get information about a series, which is a template for recurring events (e.g., monthly jobs reports, daily weather).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seriesTicker` | string | ✅ | The series ticker (e.g., 'INXD' for S&P 500) |

### `GET_SETTLEMENTS`
Get your settlement history showing resolved markets and their payouts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string |  | Filter by market ticker |
| `eventTicker` | string |  | Filter by event ticker (comma-separated, max 10) |
| `limit` | number |  | Number of results (1-200, default 100) |
| `cursor` | string |  | Pagination cursor |
| `minTs` | number |  | Filter settlements after this Unix timestamp |
| `maxTs` | number |  | Filter settlements before this Unix timestamp |

### `GET_TRADES`
Get recent public trades across all markets or for a specific market. Each trade shows price, quantity, and timestamp.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string |  | Filter by market ticker |
| `limit` | number |  | Number of results (1-1000, default 100) |
| `cursor` | string |  | Pagination cursor |
| `minTs` | number |  | Filter trades after this Unix timestamp |
| `maxTs` | number |  | Filter trades before this Unix timestamp |

<!-- AUTO-GENERATED TOOLS END -->
