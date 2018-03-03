'use strict';

const {
	div, h2, span, p, input, fieldset, legend, label, hr, button, i,
	ul, li, table, thead, tbody, tr, td, th, h, img
} = require('iblokz-snabbdom-helpers');

const actionMaps = [];

module.exports = ({state, actions, params = {}}) => div('.midi-map', params, [
	div('.header', [
		h2([img('[src="assets/midi.svg"]'), span('MIDI Map')])
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
							span('.right', 'R'),
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.data.in.indexOf(index) > -1
								},
								on: {
									click: () => actions.midiMap.toggleData('in', index)
								}
							}),
							span('.right.fa.fa-clock-o'),
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.clock.in.indexOf(index) > -1
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
							span('.right.fa.fa-clock-o'),
							input('.right[type="checkbox"]', {
								props: {
									checked: state.midiMap.clock.out.indexOf(index) > -1
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
			table([
				thead(tr([
					th('status'),
					th('key'),
					th('section'),
					th('prop'),
					th('min'),
					th('max'),
					th('dg')
				])),
				tbody(state.midiMap.map.map(mapping =>
					tr([
						td(mapping[0]),
						td(mapping[1]),
						// section
						td(mapping[2][0]),
						// prop
						td(mapping[2].slice(1).join(', ')),
						// min
						td(mapping[3] || 0),
						// max
						td(mapping[4] || 1),
						// digits
						td(mapping[5])
					])
				))
			])
		])
	])
]);
