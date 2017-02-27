'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

module.exports = ({name, state, actions}) => fieldset([
	legend([span('.on', name.toUpperCase())]),
	div('.on-switch.fa', {
		on: {click: ev => actions.instrument.updateProp(name, 'on', !state.instrument[name].on)},
		class: {
			'fa-circle-thin': !state.instrument[name].on,
			'on': state.instrument[name].on,
			'fa-circle': state.instrument[name].on
		}
	}),
	label(`Cutoff`),
	span('.right', `${state.instrument[name].cutoff}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.instrument[name].cutoff},
		on: {change: ev => actions.instrument.updateProp(name, 'cutoff', parseFloat(ev.target.value))}
	}),
	label(`Resonance`),
	span('.right', `${state.instrument[name].resonance}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.instrument[name].resonance},
		on: {change: ev => actions.instrument.updateProp(name, 'resonance', parseFloat(ev.target.value))}
	})
	// label(`Gain`),
	// span('.right', `${state.instrument[name].gain}`),
	// input('[type="range"]', {
	// 	attrs: {min: 0, max: 1, step: 0.005},
	// 	props: {value: state.instrument[name].gain},
	// 	on: {change: ev => actions.instrument.updateProp(name, 'gain', parseFloat(ev.target.value))}
	// })
]);
