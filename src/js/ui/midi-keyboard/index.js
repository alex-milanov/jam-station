'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i
} = require('iblokz-snabbdom-helpers');

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const iterate = (value, step, max) => [].concat(
	[value],
	(value + step <= max)
		? iterate(value + step, step, max)
		: []
);

const parseKey = key => ({
	key,
	octave: parseInt(key.slice(key.length - 1), 10),
	note: key.slice(0, key.length - 1),
	isSharp: key.indexOf('#') > 0,
	isFlat: key.indexOf('b') > 0
});

const generateKeys = (start, end) => [{start: parseKey(start), end: parseKey(end)}]
	.map(({start, end}) => iterate(start.octave, 1, end.octave).map(octave =>
		((octave === start.octave) && iterate(notes.indexOf(start.note), 1, notes.length - 1)
		|| (octave === end.octave) && iterate(0, 1, notes.indexOf(end.note))
		|| notes.map((note, i) => i))
			.map(i => (notes[i] + octave))
	)).pop().reduce((a1, a2) => a1.concat(a2), []);

// console.log(generateKeys('C1', 'C3'));

module.exports = ({state, actions, params = {}}) => div('.midi-keyboard', params, [
	div('.header', [
		h2([i('.fa.fa-keyboard-o'), ' MIDI Keyboard'])
	]),
	div('.body', [
		div('.keys', generateKeys('C1', 'C4').map(parseKey).map(key =>
			div(((key.isSharp || key.isFlat) ? '.black' : '.white'),
				(key.note === 'C') ? [span(key.key)] : []
			)
		))
	])
]);
