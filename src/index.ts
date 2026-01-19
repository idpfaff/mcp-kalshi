#!/usr/bin/env node
import { FastMCP } from "fastmcp";

async function main() {
	console.log("Initializing Kalshi MCP Server...");

	const server = new FastMCP({
		name: "Kalshi MCP Server",
		version: "0.0.1",
	});

	// Tools will be added here as we implement them

	try {
		await server.start({
			transportType: "stdio",
		});
		console.log("Kalshi MCP Server started successfully over stdio.");
	} catch (error) {
		console.error("Failed to start Kalshi MCP Server:", error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("An unexpected error occurred in the Kalshi MCP Server:", error);
	process.exit(1);
});
