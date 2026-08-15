// Plain Math.random() picks can repeat by chance even with a large pool —
// three spins in a row landing on the same line feels broken to a user even
// though it's mathematically unlikely, not impossible. Track a rolling
// history per pool and exclude those from the next pick, so nothing repeats
// until a real chunk of the pool has been seen.
export function createNoRepeatPicker<T>(items: T[], historyFraction = 0.4) {
	const historySize = Math.max(1, Math.min(items.length - 1, Math.floor(items.length * historyFraction)));
	let recent: T[] = [];

	return function pick(): T {
		const available = items.filter((item) => !recent.includes(item));
		const pool = available.length > 0 ? available : items;
		const choice = pool[Math.floor(Math.random() * pool.length)];
		recent.push(choice);
		if (recent.length > historySize) recent.shift();
		return choice;
	};
}
