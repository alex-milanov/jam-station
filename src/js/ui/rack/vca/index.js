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

module.exports = ({name, state, actions}) => div('.vertical', [
	label(`GN`),
	span('.right', `${state.rack[name].volume}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.rack[name].volume},
		on: {
			change: ev => actions.instrument.updateProp(name, 'volume', parseFloat(ev.target.value)),
			wheel: ev => (
				ev.preventDefault(),
				actions.instrument.updateProp(name, 'volume',
					parseFloat((state.rack[name].volume - ev.deltaY / 53 * 0.01).toFixed(2))
				)
			)
		}
	}),
	label(`ATT`),
	span('.right', `${state.rack[name].attack}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.rack[name].attack},
		on: {change: ev => actions.instrument.updateProp(name, 'attack', parseFloat(ev.target.value))}
	}),
	label(`DEC`),
	span('.right', `${state.rack[name].decay}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.rack[name].decay},
		on: {change: ev => actions.instrument.updateProp(name, 'decay', parseFloat(ev.target.value))}
	}),
	label(`SUS`),
	span('.right', `${state.rack[name].sustain}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.rack[name].sustain},
		on: {change: ev => actions.instrument.updateProp(name, 'sustain', parseFloat(ev.target.value))}
	}),
	label(`REL`),
	span('.right', `${state.rack[name].release}`),
	input('[type="range"]', {
		attrs: {min: 0, max: 1, step: 0.01},
		props: {value: state.rack[name].release},
		on: {change: ev => actions.instrument.updateProp(name, 'release', parseFloat(ev.target.value))}
	})
]);
