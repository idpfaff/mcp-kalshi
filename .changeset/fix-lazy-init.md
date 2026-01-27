---
"@iqai/mcp-kalshi": patch
---

Fix lazy client initialization and upgrade fastmcp to 3.30.1
- Use getter for KalshiClient to defer initialization until first API call
- This allows the MCP server to start without requiring KALSHI_API_KEY
- Upgrade fastmcp from 1.27.7 to 3.30.1 to fix completions compatibility
