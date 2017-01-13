'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz/adapters/vdom');

const vco = require('./vco');
const vca = require('./vca');

const types = [
	'sine',
	'square',
	'sawtooth',
	'triangle'
];

const vcas = ['vca1', 'vca2', 'vca3', 'vca4'];

module.exports = ({state, actions}) => div('.instrument', [
	div('.header', [
		h2([i('.fa.fa-sliders'), ' Instrument'])
	]),
	div('.body', [
		form({on: {submit: ev => ev.preventDefault()}}, [
			// VCO1
			vco({state, actions, name: 'vco1'}),
			vco({state, actions, name: 'vco2'}),
			fieldset([
				legend(vcas.map((name, i) =>
					span({
						class: {on: state.instrument.vcaOn === i},
						on: {click: () => actions.instrument.setVca(i)}
					}, name.toUpperCase())
				)),
				vca({state, actions, name: vcas[state.instrument.vcaOn]})
			]),
			// VCF
			fieldset([
				legend([span('.on', 'VCF1')]),
				div('.on-switch.fa', {
					on: {click: ev => actions.instrument.updateProp('vcf', 'on', !state.instrument.vcf.on)},
					class: {
						'fa-circle-thin': !state.instrument.vcf.on,
						'on': state.instrument.vcf.on,
						'fa-circle': state.instrument.vcf.on
					}
				}),
				label(`Cutoff`),
				span('.right', `${state.instrument.vcf.cutoff}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1, step: 0.01},
					props: {value: state.instrument.vcf.cutoff},
					on: {change: ev => actions.instrument.updateProp('vcf', 'cutoff', parseFloat(ev.target.value))}
				}),
				label(`Resonance`),
				span('.right', `${state.instrument.vcf.resonance}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1, step: 0.01},
					props: {value: state.instrument.vcf.resonance},
					on: {change: ev => actions.instrument.updateProp('vcf', 'resonance', parseFloat(ev.target.value))}
				})
				// label(`Gain`),
				// span('.right', `${state.instrument.vcf.gain}`),
				// input('[type="range"]', {
				// 	attrs: {min: 0, max: 1, step: 0.005},
				// 	props: {value: state.instrument.vcf.gain},
				// 	on: {change: ev => actions.instrument.updateProp('vcf', 'gain', parseFloat(ev.target.value))}
				// })
			]),
			fieldset([
				legend([
					span('.on', 'LFO'),
					div(types.reduce((list, type) => list.concat([
						button(`.btn-opt`, {
							on: {
								click: ev => actions.instrument.updateProp('lfo', 'type', type)
							},
							class: {on: (state.instrument.lfo.type === type)}
						}, [i(`.i_${type === 'triangle' ? 'triangular' : type}_wave`)])
					]), []))
				]),
				div('.on-switch.fa', {
					on: {click: ev => actions.instrument.updateProp('lfo', 'on', !state.instrument.lfo.on)},
					class: {
						'fa-circle-thin': !state.instrument.lfo.on,
						'on': state.instrument.lfo.on,
						'fa-circle': state.instrument.lfo.on
					}
				}),
				label(`Frequency`),
				span('.right', `${state.instrument.lfo.frequency}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 100, step: 0.05},
					props: {value: state.instrument.lfo.frequency},
					on: {change: ev => actions.instrument.updateProp('lfo', 'frequency', parseFloat(ev.target.value))}
				}),
				label(`Gain`),
				span('.right', `${state.instrument.lfo.gain}`),
				input('[type="range"]', {
					attrs: {min: 0, max: 1000, step: 1},
					props: {value: state.instrument.lfo.gain},
					on: {change: ev => actions.instrument.updateProp('lfo', 'gain', parseFloat(ev.target.value))}
				})
			])
		])
	])
]);
