'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz/adapters/vdom');

const types = [
	'sine',
	'square',
	'sawtooth',
	'triangle'
];

module.exports = ({state, actions}) => div('.instrument', [
	div('.header', [
		h2([i('.fa.fa-sliders'), ' Instrument'])
	]),
	div('.body', [
		form({on: {submit: ev => ev.preventDefault()}}, [
			// VCO1
			fieldset([
				legend([
					span('.on', 'VCO1'),
					div(types.reduce((list, type) => list.concat([
						button(`.btn-opt`, {
							on: {
								click: ev => actions.instrument.updateProp('vco1', 'type', type)
							},
							class: {on: (state.instrument.vco1.type === type)}
						}, [i(`.i_${type === 'triangle' ? 'triangular' : type}_wave`)])
					]), [])),
					img('[src="assets/tuning-fork.png"]'),
					div('.knob', {
						style: {
							transform: `rotate(${state.instrument.vco1.detune / 100 * 135}deg)`
						},
						on: {
							wheel: ev => (
								ev.preventDefault(),
								actions.instrument.updateProp('vco1', 'detune', state.instrument.vco1.detune - ev.deltaY / 53)
							)
						}
					}),
					input('[size="3"][type="number"]', {
						props: {value: state.instrument.vco1.detune},
						on: {input: ev => actions.instrument.updateProp('vco1', 'detune', ev.target.value)}
					})
				]),
				div('.on-switch.fa', {
					on: {click: ev => actions.instrument.updateProp('vco1', 'on', !state.instrument.vco1.on)},
					class: {
						'fa-circle-thin': !state.instrument.vco1.on,
						'on': state.instrument.vco1.on,
						'fa-circle': state.instrument.vco1.on
					}
				})
			]),
			// VCO2
			fieldset([
				legend([
					span('.on', 'VCO2'),
					div(types.reduce((list, type) => list.concat([
						button(`.btn-opt`, {
							on: {
								click: ev => actions.instrument.updateProp('vco2', 'type', type)
							},
							class: {on: (state.instrument.vco2.type === type)}
						}, [i(`.i_${type === 'triangle' ? 'triangular' : type}_wave`)])
					]), [])),
					img('[src="assets/tuning-fork.png"]'),
					div('.knob', {
						style: {
							transform: `rotate(${state.instrument.vco2.detune / 100 * 135}deg)`
						},
						on: {
							wheel: ev => (
								ev.preventDefault(),
								actions.instrument.updateProp('vco2', 'detune', state.instrument.vco2.detune - ev.deltaY / 53)
							)
						}
					}),
					input('[size="3"][type="number"]', {
						props: {value: state.instrument.vco2.detune},
						on: {input: ev => actions.instrument.updateProp('vco2', 'detune', ev.target.value)}
					})
				]),
				div('.on-switch.fa', {
					on: {click: ev => actions.instrument.updateProp('vco2', 'on', !state.instrument.vco2.on)},
					class: {
						'fa-circle-thin': !state.instrument.vco2.on,
						'on': state.instrument.vco2.on,
						'fa-circle': state.instrument.vco2.on
					}
				})
			]),
			fieldset([
				legend([
					span('.on', 'VCA1'),
					span('VCA2')
				]),
				div('.vertical', [
					label(`Volume`),
					span('.right', `${state.instrument.vca1.volume}`),
					input('[type="range"]', {
						attrs: {min: 0, max: 1, step: 0.005},
						props: {value: state.instrument.vca1.volume},
						on: {change: ev => actions.instrument.updateProp('vca1', 'volume', parseFloat(ev.target.value))}
					}),
					label(`Attack`),
					span('.right', `${state.instrument.vca1.attack}`),
					input('[type="range"]', {
						attrs: {min: 0, max: 1, step: 0.005},
						props: {value: state.instrument.vca1.attack},
						on: {change: ev => actions.instrument.updateProp('vca1', 'attack', parseFloat(ev.target.value))}
					}),
					label(`Decay`),
					span('.right', `${state.instrument.vca1.decay}`),
					input('[type="range"]', {
						attrs: {min: 0, max: 1, step: 0.005},
						props: {value: state.instrument.vca1.decay},
						on: {change: ev => actions.instrument.updateProp('vca1', 'decay', parseFloat(ev.target.value))}
					}),
					label(`Sustain`),
					span('.right', `${state.instrument.vca1.sustain}`),
					input('[type="range"]', {
						attrs: {min: 0, max: 1, step: 0.005},
						props: {value: state.instrument.vca1.sustain},
						on: {change: ev => actions.instrument.updateProp('vca1', 'sustain', parseFloat(ev.target.value))}
					}),
					label(`Release`),
					span('.right', `${state.instrument.vca1.release}`),
					input('[type="range"]', {
						attrs: {min: 0, max: 1, step: 0.005},
						props: {value: state.instrument.vca1.release},
						on: {change: ev => actions.instrument.updateProp('vca1', 'release', parseFloat(ev.target.value))}
					})
				])
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
