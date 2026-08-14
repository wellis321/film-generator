export const spinAgainLabels = [
	'Spin again',
	'Do it again',
	'Once more, for science',
	'Tempt fate again',
	'Again. Why not.',
	'Push your luck'
];

export function randomSpinAgainLabel() {
	return spinAgainLabels[Math.floor(Math.random() * spinAgainLabels.length)];
}
