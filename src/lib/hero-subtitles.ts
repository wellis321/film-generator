import { createNoRepeatPicker } from './random-pick';

export const heroSubtitles = [
	"Press the button. Whatever it lands on, that's what we're watching.",
	'One button. Zero say in the matter.',
	'The wheel decides. We just suffer through it.',
	'Free will is an illusion. This wheel is real.',
	"Press it. There's no take-backs.",
	'A random number generator, dressed up as fate.',
	'Democracy had its chance. Now the wheel decides.',
	'No refunds. No regrets. Well, mostly regrets.',
	'Consult no one. Press the button.',
	'The wheel has never once had our best interests at heart.',
	'One press. Infinite consequences. Mild consequences, but still.',
	'We built this so we could blame something other than ourselves.',
	'Resistance is futile. The wheel always wins.',
	'A tiny act of self-sabotage, gamified.',
	'This is how the evening gets decided now. Forever.',
	'Somewhere between fate and a bad decision.',
	'A button, a wheel, and a complete lack of accountability.',
	'The wheel does not care about your Tuesday plans.',
	'Chosen by chance. Endured by choice.',
	'Whatever happens next is not on us.',
	'Spin first. Regret later. Regret is non-negotiable.',
	'Free will was overrated anyway.',
	'The wheel does not accept feedback.',
	'One spin. Several regrets, pending.',
	'This is not democracy. This is a wheel.',
	"Outsourcing tonight's decision to physics.",
	'The wheel has never apologised. Not once.',
	'A gamble dressed up as a Tuesday.',
	'Nobody asked the wheel to be fair.',
	'Spin it. Blame it. Repeat.',
	'The wheel remembers nothing. We remember everything.'
];

const pickHeroSubtitle = createNoRepeatPicker(heroSubtitles);

export function randomHeroSubtitle() {
	return pickHeroSubtitle();
}
