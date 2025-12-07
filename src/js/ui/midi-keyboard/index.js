'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i, img
} = require('iblokz-snabbdom-helpers');

const {fn} = require('iblokz-data');

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
		// h2([img('[src="/assets/midi-keyboard.svg"]'), span('MIDI Keyboard')])
	]),
	div('.body', [
		div('.keys', {
			on: {
				// pointerdown: e => e.target.releasePointerCapture(e.pointerId)
			}
		}, fn.pipe(
			() => generateKeys('C2', 'C6').map(parseKey),
			allKeys => ({allKeys, whiteKeysLength: allKeys.filter(key => !key.isSharp && !key.isFlat).length}),
			({allKeys, whiteKeysLength}) => allKeys.map((key, index) =>
				div(((key.isSharp || key.isFlat) ? '.black' : '.white'), {
					style: !(key.isSharp || key.isFlat)
						? {
							width: (99.9 / whiteKeysLength) + '%',
							marginLeft: (index > 0 && allKeys[index - 1] && (allKeys[index - 1].isSharp || allKeys[index - 1].isBlack))
								? -(70 / whiteKeysLength / 2) + '%' : 0
						}
						: {
							width: (70 / whiteKeysLength) + '%',
							marginLeft: -(70 / whiteKeysLength / 2) + '%'
						},
					on: {
						pointerdown: e => (
							actions.midiMap.noteOn(-1, 1, key.key, 0.7),
							e.target.releasePointerCapture(e.pointerId)
						),
						pointerup: e => (
							actions.midiMap.noteOn(-1, 1, key.key, 0),
							e.target.releasePointerCapture(e.pointerId)
						),
						pointerenter: ev => ev.buttons === 1 && actions.midiMap.noteOn(-1, 1, key.key, 0.7),
						pointerleave: ev => ev.buttons === 1 && actions.midiMap.noteOn(-1, 1, key.key, 0),
					},
					class: {
						on: Object.keys(state.midiMap.channels).reduce(
							(pressed, ch) => Object.assign({}, pressed, state.midiMap.channels[ch]),
							{}
						)[key.key]
					}
				}, (key.note === 'C') ? [span(key.key)] : [])
			)
		)())
	])
]);
