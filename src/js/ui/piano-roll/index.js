'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i,
	ul, li, table, thead, tbody, tr, td, th, h, canvas, img
} = require('iblokz-snabbdom-helpers');

const {cursor} = require('iblokz-gfx');
const {iconCodeToDataURL} = cursor;

const actionMaps = [];

const editTools = [
	{name: 'pointer', icon: 'mouse-pointer', cursor: '\uf245'},
	{name: 'pencil', icon: 'pencil', cursor: '\uf040'},
	{name: 'eraser', icon: 'eraser', cursor: '\uf12d'}
]

console.log(editTools);

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
		div('.edit-tools', editTools.map(tool =>
			button(`.fa.fa-${tool.icon}`, {
				class: {selected: state.pianoRoll.tool === tool.name},
				on: {click: () => actions.set(['pianoRoll', 'tool'], tool.name)}
			}),
		)),
		div('.right', [
			button('.fa.fa-close', {on: {
				click: () => actions.pianoRoll.clear()
			}})
		])
	]),
	div('.body', [
		canvas('.grid'),
		canvas('.events'),
		canvas('.selection'),
		canvas('.interaction', {
			style: {
				cursor: `url(${
					iconCodeToDataURL(
						editTools.find(t => t.name === state.pianoRoll.tool).cursor
					)
				}), auto`
			},
			on: {
				pointerdown: ev => (
					console.log('pointerdown', ev),
					actions.pianoRoll.pointerDown({x: ev.offsetX, y: ev.offsetY})
				),
				pointermove: ev => (
					// console.log('pointermove', ev),
					actions.pianoRoll.pointerMove({x: ev.offsetX, y: ev.offsetY})
				),
				pointerup: ev => (
					console.log('pointerup', ev),
					actions.pianoRoll.pointerUp({x: ev.offsetX, y: ev.offsetY})
				),
				mousewheel: ev => (
					newPos => newPos <= 108 && (newPos - parseInt(ev.target.offsetHeight / 12, 10)) > 21
						? actions.set(['pianoRoll', 'position'],
							[state.pianoRoll.position && state.pianoRoll.position[0] || 0, newPos])
						: true
				)((state.pianoRoll.position && state.pianoRoll.position[1] || 60)
					+ Math.ceil(Math.abs(ev.deltaY / 60)) * (ev.deltaY > 0 ? -1 : 1))
					// console.log(parseInt(ev.target.offsetHeight / 12, 10), Math.ceil(Math.abs(ev.deltaY / 40)) * (ev.deltaY > 0 ? -1 : 1))
			}
		})
	])
]);
