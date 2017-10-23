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
	label(`Seconds`),
	' ',
	// span('.right', `${state.rack[name].seconds}`),
	input('[type="number"]', {
		attrs: {min: 1, max: 50, step: 0.01},
		props: {value: state.rack[name].seconds},
		on: {change: ev => actions.instrument.updateProp(name, 'seconds', parseFloat(ev.target.value))}
	}),
	' ',
	label(`Decay`),
	// span('.right', `${state.rack[name].decay}`),
	' ',
	input('[type="number"]', {
		attrs: {min: 0, max: 100, step: 0.01},
		props: {value: state.rack[name].decay},
		on: {change: ev => actions.instrument.updateProp(name, 'decay', parseFloat(ev.target.value))}
	}),
	' ',
	label(`Reverse`),
	// span('.right', `${state.rack[name].reverse}`),
	' ',
	button('.fa', {
		class: {
			'fa-toggle-on': state.rack[name].reverse,
			'fa-toggle-off': !state.rack[name].reverse
		},
		on: {
			click: () => actions.instrument.updateProp(name, 'reverse', !state.rack[name].reverse)
		}
	}),
	br(),
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
