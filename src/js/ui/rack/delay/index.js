'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

module.exports = ({name, state, actions}) => fieldset([
	legend([span('.on', name.toUpperCase())]),
	div('.on-switch.fa', {
		on: {click: ev => actions.instrument.updateProp(name, 'on', !state.rack[name].on)},
		class: {
			'fa-circle-thin': !state.rack[name].on,
			'on': state.rack[name].on,
			'fa-circle': state.rack[name].on
		}
	}),
	label(`Time`),
	span('.right', `${state.rack[name].time}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 3, step: 0.01},
		props: {value: state.rack[name].cutoff},
		on: {change: ev => actions.instrument.updateProp(name, 'time', parseFloat(ev.target.value))}
	}),
	label(`Dry`),
	span('.right', `${state.rack[name].dry}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.rack[name].dry},
		on: {change: ev => actions.instrument.updateProp(name, 'dry', parseFloat(ev.target.value))}
	}),
	label(`Wet`),
	span('.right', `${state.rack[name].wet}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.rack[name].wet},
		on: {change: ev => actions.instrument.updateProp(name, 'wet', parseFloat(ev.target.value))}
	})
	// label(`Gain`),
	// span('.right', `${state.rack[name].gain}`),
	// input('[type="range"]', {
	// 	attrs: {min: 0, max: 1, step: 0.005},
	// 	props: {value: state.rack[name].gain},
	// 	on: {change: ev => actions.instrument.updateProp(name, 'gain', parseFloat(ev.target.value))}
	// })
]);
