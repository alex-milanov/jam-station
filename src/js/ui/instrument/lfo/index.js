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
		]), []))
	]),
	div('.on-switch.fa', {
		on: {click: ev => actions.instrument.updateProp(name, 'on', !state.instrument[name].on)},
		class: {
			'fa-circle-thin': !state.instrument[name].on,
			'on': state.instrument[name].on,
			'fa-circle': state.instrument[name].on
		}
	}),
	label(`Frequency`),
	span('.right', `${state.instrument[name].frequency}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 100, step: 0.05},
		props: {value: state.instrument[name].frequency},
		on: {change: ev => actions.instrument.updateProp(name, 'frequency', parseFloat(ev.target.value))}
	}),
	label(`Gain`),
	span('.right', `${state.instrument[name].gain}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1000, step: 1},
		props: {value: state.instrument[name].gain},
		on: {change: ev => actions.instrument.updateProp(name, 'gain', parseFloat(ev.target.value))}
	})
]);
