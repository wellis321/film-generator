import { createNoRepeatPicker } from './random-pick';

export const spinAgainLabels = [
	'Spin again',
	'Do it again',
	'Once more, for science',
	'Tempt fate again',
	'Again. Why not.',
	'Push your luck',
	'One more spin',
	'Go on then',
	'Try again',
	'Roll the dice again',
	'Give it another go',
	'Spin harder this time',
	'Round two',
	'Test fate further',
	'Once more unto the breach'
];

const pickSpinAgainLabel = createNoRepeatPicker(spinAgainLabels);

export function randomSpinAgainLabel() {
	return pickSpinAgainLabel();
}
