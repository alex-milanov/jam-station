'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i,
	ul, li, table, thead, tbody, tr, td, th, h, canvas, img
} = require('iblokz-snabbdom-helpers');

const actionMaps = [];

module.exports = ({state, actions, params = {}}) => div('.piano-roll', params, [
	div('.header', [
		h2([img('[src="assets/piano-roll.svg"]'), span('Piano Roll')]),
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
		canvas('.interaction')
	])
]);
