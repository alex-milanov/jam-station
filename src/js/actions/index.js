'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const studio = require('./studio');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');

// util
const {assignPropVal} = require('../util/data');
const {measureToBeatLength} = require('../util/math');

const stream = new Subject();

const init = () => stream.onNext(state => ({
	bpm: '120',
	measure: '4/4',
	beatLength: 16,
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
	playing: false,
	tickIndex: -1,
	midi: {
		inputs: [],
		outputs: []
	}
}));

module.exports = {
	stream: $.merge(stream, studio.stream, sequencer.stream, midiMap.stream),
	studio,
	sequencer,
	midiMap,
	init
};
