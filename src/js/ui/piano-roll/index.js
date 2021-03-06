'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i,
	ul, li, table, thead, tbody, tr, td, th, h, canvas, img
} = require('iblokz-snabbdom-helpers');

const actionMaps = [];

module.exports = ({state, actions, params = {}}) => div('.piano-roll', params, [
	div('.header', [
		h2([img('[src="assets/piano-roll.svg"]'), span('Piano Roll')]),
		label('LN'),
		input('.bars-length', {
			props: {value: state.pianoRoll.barsLength || 4, size: 3},
			on: {input: ev => actions.set(['pianoRoll', 'barsLength'], ev.target.value)}
		}),
		label('BAR'),
		span('.cipher', [
			button('.left.fa.fa-caret-left', {on: {click: () => actions.pianoRoll.prev()}}),
			input('.bar[type="number"]', {props: {
				value: state.studio.tick.tracks[state.session.selection.piano[0]]
					&& state.studio.tick.tracks[state.session.selection.piano[0]].bar || 0,
				size: 6
			}}),
			button('.right.fa.fa-caret-right', {on: {click: () => actions.pianoRoll.next()}})
		]),
		div('.right', [
			button('.fa.fa-eraser', {on: {
				click: () => actions.pianoRoll.clear()
			}})
		])
	]),
	div('.body', [
		canvas('.grid'),
		canvas('.events'),
		canvas('.selection'),
		canvas('.interaction', {
			on: {
				mousewheel: ev => (
					newPos => newPos <= 108 && (newPos - parseInt(ev.target.offsetHeight / 12, 10)) > 21
						? actions.set(['pianoRoll', 'position'],
							[state.pianoRoll.position && state.pianoRoll.position[0] || 0, newPos])
						: true
				)((state.pianoRoll.position && state.pianoRoll.position[1] || 60) + Math.ceil(Math.abs(ev.deltaY / 60)) * (ev.deltaY > 0 ? -1 : 1))
					// console.log(parseInt(ev.target.offsetHeight / 12, 10), Math.ceil(Math.abs(ev.deltaY / 40)) * (ev.deltaY > 0 ? -1 : 1))
			}
		})
	])
]);
