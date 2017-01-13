'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const obj = require('iblokz/common/obj');

const stream = new Subject();

const initial = {
	vcaOn: 0,
	vca1: {
		volume: 0.7,
		attack: 0,
		decay: 0.04,
		sustain: 0.8,
		release: 0.08
	},
	vca2: {
		volume: 0.7,
		attack: 0,
		decay: 0.04,
		sustain: 0.8,
		release: 0.08
	},
	vca3: {
		volume: 0.7,
		attack: 0,
		decay: 0.04,
		sustain: 0.8,
		release: 0.08
	},
	vca4: {
		volume: 0.7,
		attack: 0,
		decay: 0.04,
		sustain: 0.8,
		release: 0.08
	},
	vco1: {
		on: true,
		type: 'square',
		detune: 0
	},
	vco2: {
		on: false,
		type: 'square',
		detune: 0
	},
	lfo: {
		on: false,
		type: 'sawtooth',
		frequency: 5,
		gain: 0.15
	},
	vcf: {
		on: false,
		cutoff: 1,
		resonance: 0,
		gain: 0
	}
};

const updateProp = (param, prop, value) => stream.onNext(
	state => obj.patch(state, ['instrument', param, prop], value)
);

const setVca = index => stream.onNext(
	state => obj.patch(state, ['instrument', 'vcaOn'], index)
);

module.exports = {
	stream,
	initial,
	updateProp,
	setVca
};
