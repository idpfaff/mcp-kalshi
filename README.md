# Kalshi MCP Server

A Model Context Protocol (MCP) server implementation for interacting with Kalshi's prediction markets. This server provides tools for retrieving market data and executing trades through the Kalshi API, enabling AI agents to interact with prediction markets seamlessly.

## Features

### Market Data Tools
- **GET_MARKETS**: List and discover prediction markets with filtering by status, series, or event
- **GET_MARKET**: Get detailed information about a specific market
- **GET_MARKET_ORDERBOOK**: View current order book bid/ask depth
- **GET_TRADES**: Get recent public trades across markets
- **GET_SERIES**: Get information about recurring event series

### Portfolio Tools
- **GET_BALANCE**: Check account balance and portfolio value
- **GET_POSITIONS**: View current portfolio positions with P&L
- **GET_FILLS**: Get trade fill history
- **GET_SETTLEMENTS**: View settlement history and payouts

### Trading Tools
- **GET_ORDERS**: List your orders with status filtering
- **GET_ORDER**: Get details of a specific order
- **CREATE_ORDER**: Place limit or market orders
- **CANCEL_ORDER**: Cancel a specific order
- **BATCH_CANCEL_ORDERS**: Cancel multiple orders at once
- **DECREASE_ORDER**: Reduce order quantity without full cancellation

## Quick Start

### Using with npx (Recommended)

The easiest way to use this MCP server is with `npx`:

```json
{
  "mcpServers": {
    "kalshi": {
      "command": "npx",
      "args": ["mcp-kalshi"],
      "env": {
        "KALSHI_API_KEY": "your_api_key_here",
        "KALSHI_PRIVATE_KEY_PATH": "./path/to/your/private-key.pem"
      }
    }
  }
}
```

Or with the private key as a PEM string:

```json
{
  "mcpServers": {
    "kalshi": {
      "command": "npx",
      "args": ["mcp-kalshi"],
      "env": {
        "KALSHI_API_KEY": "your_api_key_here",
        "KALSHI_PRIVATE_KEY_PEM": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
      }
    }
  }
}
```

### Manual Installation (For Development)

```bash
git clone https://github.com/IQAIcom/mcp-kalshi
cd mcp-kalshi
pnpm install
pnpm run build
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KALSHI_API_KEY` | Yes | Your Kalshi API key ID |
| `KALSHI_PRIVATE_KEY_PATH` | Yes* | Path to your RSA private key PEM file |
| `KALSHI_PRIVATE_KEY_PEM` | Yes* | RSA private key as PEM string (alternative to path) |

*Either `KALSHI_PRIVATE_KEY_PATH` or `KALSHI_PRIVATE_KEY_PEM` is required.

### Getting API Credentials

1. Log in to your Kalshi account
2. Go to Settings > API Keys
3. Create a new API key pair
4. Download and save your private key securely
5. Note your API Key ID

### For Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kalshi": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-kalshi/dist/index.js"],
      "env": {
        "KALSHI_API_KEY": "your_api_key_here",
        "KALSHI_PRIVATE_KEY_PATH": "/absolute/path/to/private-key.pem"
      }
    }
  }
}
```

## Security & Privacy

### Private Key Security

Your RSA private key is used to sign API requests. Here's what you need to know:

**Your Key Stays Safe:**
- The MCP server runs entirely on your local machine
- Your private key never leaves your computer
- No data is sent to any third-party servers except Kalshi's official API
- The key is only used to sign requests and is never written to disk by the server

**Important Security Practices:**
- Never commit your private key to version control
- Never share your configuration file containing the key path
- Only use this on trusted, secure machines
- Consider using a dedicated API key with limited permissions for testing

## Usage Examples

### Sample Questions for AI Agents

**Market Discovery:**
- "What prediction markets are currently open on Kalshi?"
- "Show me markets related to cryptocurrency"
- "What's the current price for the S&P 500 market?"
- "Get the order book for INXD-25JAN20"

**Portfolio Management:**
- "What's my current account balance?"
- "Show me my open positions"
- "What trades have I made today?"
- "List my recent settlements"

**Trading:**
- "Place a limit buy order for 10 Yes contracts at 45 cents on [market]"
- "Cancel my order with ID [order_id]"
- "Show me all my resting orders"
- "Decrease my order by 5 contracts"

### Detailed Examples

#### Get Active Markets
```
Show me 5 open markets in the KXSOL15M series
```

#### Check Balance
```
What's my available balance and portfolio value?
```

#### Place a Limit Order
```
Buy 5 Yes contracts at 30 cents on KXSOL15M-26JAN210500-00
```

#### Cancel an Order
```
Cancel order e7b4f2d3-...
```

## API Documentation

This server uses the Kalshi Trade API v2:
- Base URL: `https://api.elections.kalshi.com/trade-api/v2`
- [Official API Documentation](https://docs.kalshi.com)
- [TypeScript SDK](https://docs.kalshi.com/sdks/typescript/quickstart)

## Development

### Build
```bash
pnpm run build
```

### Development Mode
```bash
pnpm run dev
```

### Run Tests
```bash
pnpm run test
```

### Linting and Formatting
```bash
pnpm run lint
pnpm run format
```

## Project Structure

```
mcp-kalshi/
├── src/
│   ├── lib/
│   │   ├── config.ts          # Configuration management
│   │   └── http.ts            # HTTP utilities
│   ├── services/
│   │   ├── kalshi-client.ts   # SDK client wrapper
│   │   ├── markets-service.ts # Market data operations
│   │   ├── portfolio-service.ts # Portfolio operations
│   │   └── orders-service.ts  # Order management
│   ├── tools/
│   │   ├── markets.ts         # Market tools (5 tools)
│   │   ├── portfolio.ts       # Portfolio tools (4 tools)
│   │   └── orders.ts          # Order tools (6 tools)
│   ├── index.ts               # MCP server entry point
│   └── test-services.ts       # Test script
├── dist/                      # Compiled output
├── .env.example               # Environment template
├── package.json
└── README.md
```

## Technologies

- **TypeScript**: Type-safe development
- **fastmcp**: MCP server implementation
- **kalshi-typescript**: Official Kalshi SDK
- **Zod**: Parameter validation
- **Biome**: Linting and formatting

## Trading on Kalshi

### How Prediction Markets Work

Kalshi markets are binary contracts that resolve to either Yes (100 cents) or No (0 cents):
- **Yes contracts**: Pay $1.00 if the event happens, $0 if not
- **No contracts**: Pay $1.00 if the event doesn't happen, $0 if it does
- Prices range from 1-99 cents, representing implied probability

### Order Types

- **Limit orders**: Specify exact price, may rest on the book
- **Market orders**: Execute immediately at best available price
- **Post-only**: Only place if order will rest (no immediate fill)
- **Reduce-only**: Only reduce existing position

### Time in Force Options

- **good_till_canceled**: Remains until filled or canceled
- **fill_or_kill**: Fill entirely immediately or cancel
- **immediate_or_cancel**: Fill what's available, cancel rest

## Disclaimer

This is an unofficial tool and is not affiliated with Kalshi. Use at your own risk. Always verify transactions and understand the risks involved in prediction market trading. Past performance does not guarantee future results.

## License

MIT
