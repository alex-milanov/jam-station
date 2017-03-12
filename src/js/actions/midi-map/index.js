'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {measureToBeatLength} = require('../../util/math');
const {obj} = require('iblokz-data');

const stream = new Subject();

const connect = devices => stream.onNext(
	state => obj.patch(state, 'midiMap', {
		devices
	})
);

const initial = {
	devices: [],
	map: {
		controller: {
			20: ['instrument', ['vcf', 'cutoff']],
			21: ['instrument', ['vcf', 'resonance']],
			22: ['studio', ['bpm'], 60, 200, 0],
			23: ['studio', ['volume']],
			24: ['instrument', ['eg', 'attack']],
			25: ['instrument', ['eg', 'decay']],
			26: ['instrument', ['eg', 'sustain']],
			27: ['instrument', ['eg', 'release']]
		}
	}
};

module.exports = {
	stream,
	initial,
	connect
};
