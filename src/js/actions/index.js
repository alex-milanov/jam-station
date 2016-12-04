'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const studio = require('./studio');
const instrument = require('./instrument');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');

// util
const obj = require('iblokz/common/obj');
const {measureToBeatLength} = require('../util/math');

const stream = new Subject();

const toggleUI = editor => stream.onNext(state => obj.patch(state, ['ui', editor], !state.ui[editor]));

const initial = {
	ui: {
		mediaLibrary: true,
		instrument: true,
		sequencer: true,
		midiMap: true
	},
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
		0,
		5,
		9,
		14,
		18
	],
	samples: [
		'kick01.ogg',
		'kick02.ogg',
		'kick03.ogg',
		'kick04.ogg',
		'kick_hiphop01.ogg',
		'hihat_opened02.ogg',
		'hihat_opened03.ogg',
		'ride02.ogg',
		'rim01.ogg',
		'snare01.ogg',
		'snare02.ogg',
		'snare03.ogg',
		'snare04.ogg',
		'snare05.ogg',
		'clap01.ogg',
		'clap02.ogg',
		'clap03.ogg',
		'clap04.ogg',
		'shaker01.ogg',
		'shaker02.ogg'
	],
	pattern: [
		[1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
		[0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
	],
	midi: {
		inputs: [],
		outputs: []
	}
};

module.exports = {
	stream: $.merge(stream, instrument.stream, sequencer.stream, midiMap.stream, studio.stream),
	toggleUI,
	studio,
	instrument,
	sequencer,
	midiMap,
	initial: obj.patch(initial, 'studio', studio.initial)
};
