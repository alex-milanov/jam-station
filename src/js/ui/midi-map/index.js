'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i,
	ul, li, table, thead, tbody, tr, td, th, h
} = require('iblokz-snabbdom-helpers');

const actionMaps = [];

module.exports = ({state, actions}) => div('.midi-map', [
	div('.header', [
		h2([i('.fa.fa-sitemap'), ' MIDI Map'])
	]),
	div('.body', [
		fieldset([
			legend('Devices'),
			div('.devices', [
				h('dl', [
					h('dt', 'Inputs'),
					h('dd', ul(state.midiMap.devices.inputs.map((inp, index) =>
						li([
							inp.name,
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.clock.in === index
								},
								on: {
									click: () => actions.midiMap.toggleClock('in', index)
								}
							})
						])
					)))
				]),
				h('dl', [
					h('dt', 'Outputs'),
					h('dd', ul(state.midiMap.devices.outputs.map((outp, index) =>
						li([
							outp.name,
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.clock.out === index
								},
								on: {
									click: () => actions.midiMap.toggleClock('out', index)
								}
							})
						])
					)))
				])
			])
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
