'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const studio = require('./studio');
const instrument = require('./instrument');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');
const mediaLibrary = require('./media-library');

// util
const obj = require('iblokz/common/obj');
const {measureToBeatLength} = require('../util/math');

const stream = new Subject();

const toggleUI = editor => stream.onNext(state => obj.patch(state, ['ui', editor], !state.ui[editor]));

const initial = {
	ui: {
		mediaLibrary: true,
		patches: true,
		instrument: true,
		sequencer: true,
		midiMap: true
	},
	midi: {
		inputs: [],
		outputs: []
	}
};

module.exports = {
	stream: $.merge(stream, studio.stream, instrument.stream, sequencer.stream, midiMap.stream, mediaLibrary.stream),
	toggleUI,
	studio,
	instrument,
	mediaLibrary,
	sequencer,
	midiMap,
	initial: Object.assign({}, initial, {
		studio: studio.initial,
		sequencer: sequencer.initial,
		instrument: instrument.initial,
		mediaLibrary: mediaLibrary.initial
	})
};
