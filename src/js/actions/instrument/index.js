'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const obj = require('iblokz/common/obj');

const stream = new Subject();

const updateProp = (param, prop, value) => stream.onNext(
	state => obj.patch(state, ['instrument', param, prop], value)
);

const initial = {
	eg: {
		attack: 0,
		decay: 0.04,
		sustain: 0.8,
		release: 0.08
	},
	vco: {
		type: 'square'
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

module.exports = {
	stream,
	initial,
	updateProp
};
