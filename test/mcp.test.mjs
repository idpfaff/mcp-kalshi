import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import test from "node:test";

async function listTools(env) {
	const child = spawn(process.execPath, ["dist/index.js"], {
		env: { PATH: process.env.PATH, ...env },
		stdio: ["pipe", "pipe", "pipe"],
	});
	const lines = createInterface({ input: child.stdout });
	const pending = new Map();
	const stderr = [];
	child.stderr.on("data", (c) => stderr.push(String(c)));
	lines.on("line", (line) => {
		try {
			const message = JSON.parse(line);
			const fn = pending.get(message.id);
			if (fn) {
				pending.delete(message.id);
				message.error
					? fn.reject(new Error(JSON.stringify(message.error)))
					: fn.resolve(message.result);
			}
		} catch {}
	});
	child.on("exit", (code) => {
		for (const waiter of pending.values())
			waiter.reject(new Error(`MCP exited ${code}: ${stderr.join("")}`));
	});
	let id = 0;
	const request = (method, params = {}) =>
		new Promise((resolve, reject) => {
			const next = ++id;
			pending.set(next, { resolve, reject });
			child.stdin.write(
				`${JSON.stringify({ jsonrpc: "2.0", id: next, method, params })}\n`,
			);
		});
	const timer = setTimeout(() => child.kill(), 10000);
	try {
		await request("initialize", {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: { name: "fork-tests", version: "1.0.0" },
		});
		child.stdin.write(
			`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
		);
		return (await request("tools/list")).tools.map((t) => t.name);
	} finally {
		clearTimeout(timer);
		lines.close();
		child.kill();
	}
}
test("default MCP surface exposes 11 read tools and no mutations", async () => {
	const names = await listTools({});
	assert.equal(names.length, 11);
	assert.ok(names.every((n) => n.startsWith("GET_")));
});
test("explicit demo opt-in exposes the four mutation tools", async () => {
	const names = await listTools({
		KALSHI_ENV: "demo",
		KALSHI_READ_ONLY: "false",
	});
	assert.equal(names.length, 15);
	assert.ok(names.includes("CREATE_ORDER"));
});
