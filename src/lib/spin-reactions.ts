export const spinReactions = [
	'Ah. This old chestnut.',
	'Bold choice by the wheel. Regrettable, but bold.',
	"Everyone's favourite. Not ours, but everyone's.",
	'Buckle up.',
	'We already know how this ends: badly.',
	'The people love this one. We remain deeply skeptical.',
	'Here we go again.',
	'Fate has spoken. Fate has terrible taste.',
	"Statistically, someone's crying happy tears about this. Not us.",
	"Let's see if this makes it past twenty minutes.",
	'Another crowd-pleaser. We are not the crowd.',
	"This one's got a cult following. About to see why we're not in it.",
	'Prepare to be underwhelmed, allegedly.',
	'The wheel has cursed us once more.',
	"Apparently a classic. We'll be the judge of that.",
	'Great. Just great.',
	'A beloved favourite, by all accounts except possibly ours.',
	'Sit down. This might take a while.',
	'The algorithm of fate strikes again.',
	'We have been chosen. We did not choose this.'
];

export function randomReaction() {
	return spinReactions[Math.floor(Math.random() * spinReactions.length)];
}
