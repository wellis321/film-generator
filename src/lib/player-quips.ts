function joinNames(names: string[]): string {
	if (names.length === 1) return names[0];
	if (names.length === 2) return `${names[0]} and ${names[1]}`;
	return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function pick<T>(items: T[]): T {
	return items[Math.floor(Math.random() * items.length)];
}

// Phrased as fragments/headlines rather than full sentences with a
// subject-verb pairing, so they read fine whether "names" is one person or
// several — no singular/plural agreement to get wrong.
const eliminatedTemplates = [
	(names: string) => `${names}: knocked out. Tough watch.`,
	(names: string) => `The wheel has eliminated ${names}. No refunds.`,
	(names: string) => `Out of the running: ${names}. It was the wheel, not us.`,
	(names: string) => `Gone: ${names}. The wheel does not negotiate.`,
	(names: string) => `Sent home: ${names}. The wheel remains unmoved.`
];

const stillInTemplates = [
	(names: string) => `Still in it: ${names}.`,
	(names: string) => `Living to see another round: ${names}.`,
	(names: string) => `The wheel has spared, for now: ${names}.`,
	(names: string) => `Against all reasonable odds, still in: ${names}.`,
	(names: string) => `Somehow still standing: ${names}.`
];

const noSurvivorsQuips = [
	"No one's left standing. No one can be blamed for this now — except, perhaps, the Norse gods.",
	'Every pick has fallen. Blame fate. Blame the wheel. Blame Odin, if it helps.',
	'All picks eliminated. This one goes down as an act of the gods.',
	'Nobody called it. The wheel answers to no mortal.',
	'A clean sweep of elimination. Take it up with Valhalla.'
];

const championClaimedTemplates = [
	(name: string) => `${name} called it. Somehow.`,
	(name: string) => `${name} saw this coming. We did not.`,
	(name: string) => `Credit where it's due: ${name} picked the champion.`,
	(name: string) => `${name} wins. The wheel agrees, for once.`,
	(name: string) => `${name}'s pick takes it. Gloating is permitted.`
];

export function eliminatedQuip(names: string[]): string {
	return pick(eliminatedTemplates)(joinNames(names));
}

export function stillInQuip(names: string[]): string {
	return pick(stillInTemplates)(joinNames(names));
}

export function noSurvivorsQuip(): string {
	return pick(noSurvivorsQuips);
}

export function championClaimedQuip(name: string): string {
	return pick(championClaimedTemplates)(name);
}
