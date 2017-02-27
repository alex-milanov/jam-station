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
				class: {on: (state.instrument[name].type === type)}
			}, [i(`.i_${type === 'triangle' ? 'triangular' : type}_wave`)])
		]), [])),
		img('[src="assets/tuning-fork.png"]'),
		div('.knob', {
			style: {
				transform: `rotate(${state.instrument[name].detune / 100 * 135}deg)`
			},
			on: {
				wheel: ev => (
					ev.preventDefault(),
					actions.instrument.updateProp(name, 'detune', state.instrument[name].detune - ev.deltaY / 53)
				)
			}
		}),
		input('[size="3"][type="number"]', {
			props: {value: state.instrument[name].detune},
			on: {input: ev => actions.instrument.updateProp(name, 'detune', ev.target.value)}
		})
	]),
	div('.on-switch.fa', {
		on: {click: ev => actions.instrument.updateProp(name, 'on', !state.instrument[name].on)},
		class: {
			'fa-circle-thin': !state.instrument[name].on,
			'on': state.instrument[name].on,
			'fa-circle': state.instrument[name].on
		}
	})
]);
