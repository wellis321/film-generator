import { createNoRepeatPicker } from './random-pick';

export const galleryRevealQuips = [
	'Behold: your regret, in gallery form.',
	'The wheel has spoken. Repeatedly.',
	'Pick your poison. We provided several.',
	'A lineup of questionable decisions, ready for inspection.',
	'The wheel did its worst, several times over.',
	'Choose your own adventure in disappointment.',
	'A curated selection of things we probably won\'t love.',
	'The algorithm of fate has been busy.',
	'Several verdicts in, none of them promising.',
	'We ran the wheel more than once. We regret nothing. Yet.',
	'A rogues\' gallery of crowd-pleasers.',
	'The wheel took its time and made several bad decisions.',
	'Consider this a tasting menu of regret.',
	'The house of horrors is now open for browsing.',
	'Several rounds fired. All of them landed.',
	'The wheel has given you options. That was generous of it.',
	'A whole spread of things everyone else already loves.',
	'The wheel spun more than once. Bravery has its limits.',
	'Take your pick. We take no responsibility.',
	'The evening now has several possible flavours of regret.',
	'A shortlist, assembled by an indifferent wheel.'
];

const pickGalleryQuip = createNoRepeatPicker(galleryRevealQuips);

export function randomGalleryQuip() {
	return pickGalleryQuip();
}
