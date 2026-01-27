# @iqai/mcp-kalshi

## 0.1.1

### Patch Changes

- eed3c34: Fix lazy client initialization and upgrade fastmcp to 3.30.1
  - Use getter for KalshiClient to defer initialization until first API call
  - This allows the MCP server to start without requiring KALSHI_API_KEY
  - Upgrade fastmcp from 1.27.7 to 3.30.1 to fix completions compatibility

## 0.1.0

### Minor Changes

- 1bd6e8e: feat: initial release of Kalshi MCP server

  MCP server for interacting with Kalshi prediction markets including:

  - Market discovery and search
  - Market details and series information
  - Read-only access for market research
