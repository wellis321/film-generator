export const heroSubtitles = [
	"Press the button. Whatever it lands on, that's what we're watching.",
	'One button. Zero say in the matter.',
	'The wheel decides. We just suffer through it.',
	'Free will is an illusion. This wheel is real.',
	"Press it. There's no take-backs.",
	'A random number generator, dressed up as fate.',
	'Democracy had its chance. Now the wheel decides.'
];

export function randomHeroSubtitle() {
	return heroSubtitles[Math.floor(Math.random() * heroSubtitles.length)];
}
