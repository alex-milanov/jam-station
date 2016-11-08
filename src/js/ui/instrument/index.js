'use strict';

const {
	div, h2, span, p, ul, li, hr, button,
	form, label, input, fieldset, legend
} = require('../../util/vdom');

module.exports = ({state, actions}) => div('.instrument', [
	div('.header', [
		h2('Instrument')
	]),
	div('.body', [
		form([
			fieldset([
				legend('Envelope'),
				label(`Attack`),
				span('.right', `${state.instrument.attack}`),
				input('[type="range"]', {
					attrs: {min: 0.001, max: 1, step: 0.05},
					props: {value: state.instrument.attack},
					on: {change: ev => actions.instrument.updateProp('attack', parseFloat(ev.target.value))}
				}),
				label(`Decay`),
				span('.right', `${state.instrument.decay}`),
				input('[type="range"]', {
					attrs: {min: 0.001, max: 1, step: 0.05},
					props: {value: state.instrument.decay},
					on: {change: ev => actions.instrument.updateProp('decay', parseFloat(ev.target.value))}
				}),
				label(`Sustain`),
				span('.right', `${state.instrument.sustain}`),
				input('[type="range"]', {
					attrs: {min: 0.001, max: 1, step: 0.05},
					props: {value: state.instrument.sustain},
					on: {change: ev => actions.instrument.updateProp('sustain', parseFloat(ev.target.value))}
				}),
				label(`Release`),
				span('.right', `${state.instrument.release}`),
				input('[type="range"]', {
					attrs: {min: 0.001, max: 1, step: 0.05},
					props: {value: state.instrument.release},
					on: {change: ev => actions.instrument.updateProp('release', parseFloat(ev.target.value))}
				})
			])
		])
	])
]);
