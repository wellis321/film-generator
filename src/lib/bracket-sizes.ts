export const bracketSizes = [4, 8, 16, 32, 64] as const;

export const bracketSizeLabels: Record<number, string> = {
	64: 'Ruthless Sixty-Four',
	32: 'Dirty Thirty-Two',
	16: 'Sweet Sixteen',
	8: 'Great Eight',
	4: 'Final Four',
	2: 'Decider',
	1: 'Champion'
};
