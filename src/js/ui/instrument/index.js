'use strict';

const {
	div, h2, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

const vco = require('./vco');
const vca = require('./vca');
const vcf = require('./vcf');
const lfo = require('./lfo');
const delay = require('./delay');

const types = [
	'sine',
	'square',
	'sawtooth',
	'triangle'
];

const vcas = ['vca1', 'vca2', 'vca3', 'vca4'];

module.exports = ({state, actions}) => div('.instrument', [
	div('.header', [
		h2([i('.fa.fa-tasks'), ' Instrument'])
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
			vcf({state, actions, name: 'vcf'})
			// LFO
			// lfo({state, actions, name: 'lfo'})
			// DELAY
			// delay({state, actions, name: 'delay'})
		])
	])
]);
