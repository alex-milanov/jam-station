'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i,
	ul, li, table, thead, tbody, tr, td, th
} = require('iblokz-snabbdom-helpers');

const actionMaps = [];

module.exports = ({state, actions}) => div('.midi-map', [
	div('.header', [
		h2([i('.fa.fa-sitemap'), ' MIDI Map'])
	]),
	div('.body', [
		fieldset([
			legend('Devices'),
			p(state.midiMap.devices.inputs.map(inp => inp.name).join(', '))
		]),
		fieldset([
			legend('Map'),
			table(
				thead(tr(
					th('status'),
					th('type'),
					th('section'),
					th('prop'),
					th('min'),
					th('max'),
					th('digits')
				)),
				tbody(Object.keys(state.midiMap.map).map(status => Object.keys(state.midiMap.map[status]).map(type =>
					tr([
						td(status),
						td(type),
						// section
						td(state.midiMap.map[status][type][0]),
						// prop
						td(state.midiMap.map[status][type][1].join(', ')),
						// min
						td(state.midiMap.map[status][type][2] || 0),
						// max
						td(state.midiMap.map[status][type][3] || 1),
						// digits
						td(state.midiMap.map[status][type][4])
					])
				)).reduce((a, a1) => a.concat(a1), []))
			)
		])
	])
]);
