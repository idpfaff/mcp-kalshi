---
"@iqai/mcp-kalshi": minor
---

Handle current fixed-point Kalshi prices, quantities, order books and portfolio values, preserving legacy response compatibility and avoiding invented zero values. Allow public market reads without account credentials and support separate production/demo environments.

Order changes now default to disabled. Set `KALSHI_READ_ONLY=false` explicitly to expose mutation tools; the retained legacy order-writing adapter still needs V2 migration and authenticated demo validation.
