'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const instrument = require('./instrument');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');

// util
const obj = require('iblokz/common/obj');
const {measureToBeatLength} = require('../util/math');

const stream = new Subject();

const initial = {
	instrument: {
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
			frequency: 0,
			gain: 0
		},
		vcf: {
			on: false,
			cutoff: 800,
			resonance: 80,
			gain: 0
		}
	},
	channels: [
		'Kick',
		'HiHat',
		'Snare',
		'Clap'
	],
	pattern: [
		[1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
		[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	],
	midi: {
		inputs: [],
		outputs: []
	}
};

module.exports = {
	stream: $.merge(stream, instrument.stream, sequencer.stream, midiMap.stream),
	instrument,
	sequencer,
	midiMap,
	initial
};
