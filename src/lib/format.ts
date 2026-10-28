/** Keep fixed-point API strings exact, including sub-cent prices and zeroes. */
function decimal(value: unknown): string | undefined {
	if (typeof value !== "string" && typeof value !== "number") return undefined;
	const text = String(value);
	return /^-?\d+(\.\d+)?$/.test(text) ? text : undefined;
}

export function field(value: object, name: string): unknown {
	return (value as Record<string, unknown>)[name];
}

export function dollars(value: unknown, legacyCents?: unknown): string {
	let text = decimal(value);
	if (text === undefined && value != null) return "N/A";
	if (text === undefined) {
		const cents = decimal(legacyCents);
		if (cents === undefined || cents.includes(".")) return "N/A";
		const negative = cents.startsWith("-");
		const digits = cents.replace(/^-/, "").padStart(3, "0");
		text = `${negative ? "-" : ""}${digits.slice(0, -2)}.${digits.slice(-2)}`;
	}
	const [whole, fraction = ""] = text.split(".");
	const trimmed = fraction.replace(/0+$/, "").padEnd(2, "0");
	return `${whole.startsWith("-") ? "-" : ""}$${whole.replace(/^-/, "")}.${trimmed}`;
}

export function money(value: object, name: string): string {
	return dollars(field(value, `${name}_dollars`), field(value, name));
}

export function quantity(value: object, name: string): string {
	return decimal(field(value, `${name}_fp`) ?? field(value, name)) ?? "N/A";
}

export function direction(value: object): { side: string; action: string } {
	const outcome = field(value, "outcome_side");
	const book = field(value, "book_side");
	const canonical =
		outcome ?? (book === "bid" ? "yes" : book === "ask" ? "no" : undefined);
	// Canonical direction collapses buy-yes and sell-no into the same exposure.
	// It cannot establish the legacy buy/sell action, so never invent one.
	if (canonical === "yes" || canonical === "no")
		return { side: canonical.toUpperCase(), action: "EXPOSURE" };
	const side = field(value, "side");
	const action = field(value, "action");
	return {
		side: side === "yes" || side === "no" ? side.toUpperCase() : "N/A",
		action:
			action === "buy" || action === "sell" ? action.toUpperCase() : "N/A",
	};
}

export function sidePrice(value: object): string {
	const { side, action } = direction(value);
	if (action === "EXPOSURE") return `${money(value, "yes_price")} (YES price)`;
	return side === "N/A" ? "N/A" : money(value, `${side.toLowerCase()}_price`);
}

export function pagination(value: object): string {
	const cursor = field(value, "cursor");
	return typeof cursor === "string" && cursor ? `\nNext cursor: ${cursor}` : "";
}

export function orderbookSide(
	value: unknown,
	label: string,
	inDollars: boolean,
): string {
	if (value == null || (Array.isArray(value) && value.length === 0))
		return `${label}: No orders`;
	if (!Array.isArray(value))
		throw new Error(`Invalid ${label} orderbook response.`);
	const lines = value.map((level: unknown) => {
		if (!Array.isArray(level) || level.length < 2)
			throw new Error(`Invalid ${label} price level.`);
		const price = inDollars ? dollars(level[0]) : dollars(undefined, level[0]);
		const count = decimal(level[1]);
		if (price === "N/A" || count === undefined)
			throw new Error(`Invalid ${label} price or quantity.`);
		return `  ${price}: ${count} contracts`;
	});
	return `${label}:\n${lines.join("\n")}`;
}
