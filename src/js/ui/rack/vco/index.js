'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

const types = [
	'sine',
	'square',
	'sawtooth',
	'triangle'
];

module.exports = ({name, state, actions}) => fieldset([
	legend([
		span('.on', name.toUpperCase()),
		div(types.reduce((list, type) => list.concat([
			button(`.btn-opt`, {
				on: {
					click: ev => actions.instrument.updateProp(name, 'type', type)
				},
				class: {on: (state.rack[name].type === type)}
			}, [img(`[src="assets/icons/wave-${type}.svg"]`)])
		]), [])),
		img('[src="assets/tuning-fork.png"]'),
		div('.knob', {
			style: {
				transform: `rotate(${state.rack[name].detune / 100 * 135}deg)`
			},
			on: {
				wheel: ev => (
					ev.preventDefault(),
					actions.instrument.updateProp(name, 'detune', state.rack[name].detune - ev.deltaY / 53)
				)
			}
		}),
		input('[size="3"][type="number"]', {
			props: {value: state.rack[name].detune},
			on: {input: ev => actions.instrument.updateProp(name, 'detune', ev.target.value)}
		})
	]),
	div('.on-switch.fa', {
		on: {click: ev => actions.instrument.updateProp(name, 'on', !state.rack[name].on)},
		class: {
			'fa-circle-thin': !state.rack[name].on,
			'on': state.rack[name].on,
			'fa-circle': state.rack[name].on
		}
	})
]);
