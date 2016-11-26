'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend
} = require('iblokz/adapters/vdom');

const types = [
	'sine',
	'square',
	'sawtooth',
	'triangle'
];

module.exports = ({state, actions}) => div('.instrument', [
	div('.header', [
		h2('Instrument')
	]),
	div('.body', [
		form([
			fieldset([
				legend('VCO'),
				div(types.reduce((list, type) =>
					list.concat([
						input(`[name="vco-type"][id="vco-type-${type}"][type="radio"][value="${type}"]`, {
							on: {
								click: ev => actions.instrument.updateProp('vco', 'type', ev.target.value)
							},
							attrs: {
								checked: (state.instrument.vco.type === type)
							}
						}),
						label(`[for="vco-type-${type}"]`, type.slice(0, 3))
					]),
					[]
				))
			]),
			fieldset([
				legend('LFO'),
				div(types.reduce((list, type) =>
					list.concat([
						input(`[name="lfo-type"][id="lfo-type-${type}"][type="radio"][value="${type}"]`, {
							on: {
								click: ev => actions.instrument.updateProp('lfo', 'type', ev.target.value)
							},
							attrs: {
								checked: (state.instrument.lfo.type === type)
							}
						}),
						label(`[for="lfo-type-${type}"]`, type.slice(0, 3))
					]),
					[]
				))
			]),
			// VCF
			/*
			fieldset([
				legend('VCF'),
				label(`Cutoff`),
				span('.right', `${state.instrument.vcf.cutoff}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1, step: 0.005},
					props: {value: state.instrument.vcf.cutoff},
					on: {change: ev => actions.instrument.updateProp('vcf', 'cutoff', parseFloat(ev.target.value))}
				}),
				label(`Resonance`),
				span('.right', `${state.instrument.vcf.resonance}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1, step: 0.005},
					props: {value: state.instrument.vcf.resonance},
					on: {change: ev => actions.instrument.updateProp('vcf', 'resonance', parseFloat(ev.target.value))}
				})
			]),
			*/
			fieldset([
				legend('EG (ADSR)'),
				label(`Attack`),
				span('.right', `${state.instrument.eg.attack}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1, step: 0.005},
					props: {value: state.instrument.eg.attack},
					on: {change: ev => actions.instrument.updateProp('eg', 'attack', parseFloat(ev.target.value))}
				}),
				label(`Decay`),
				span('.right', `${state.instrument.eg.decay}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1, step: 0.005},
					props: {value: state.instrument.eg.decay},
					on: {change: ev => actions.instrument.updateProp('eg', 'decay', parseFloat(ev.target.value))}
				}),
				label(`Sustain`),
				span('.right', `${state.instrument.eg.sustain}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1, step: 0.005},
					props: {value: state.instrument.eg.sustain},
					on: {change: ev => actions.instrument.updateProp('eg', 'sustain', parseFloat(ev.target.value))}
				}),
				label(`Release`),
				span('.right', `${state.instrument.eg.release}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1, step: 0.005},
					props: {value: state.instrument.eg.release},
					on: {change: ev => actions.instrument.updateProp('eg', 'release', parseFloat(ev.target.value))}
				})
			])
		])
	])
]);
