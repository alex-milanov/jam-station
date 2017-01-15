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

const ping = () => stream.onNext(state => state);

const initial = Object.assign({
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
}, {
	studio: studio.initial,
	sequencer: sequencer.initial,
	instrument: instrument.initial,
	mediaLibrary: mediaLibrary.initial
});

// todo merge loaded state
const load = content => stream.onNext(state => Object.assign({}, state, {
	studio: content.studio || state.studio,
	sequencer: content.sequencer || state.sequencer,
	instrument: content.instrument || state.instrument
}));
const clear = () => load(initial);

module.exports = {
	stream: $.merge(stream, studio.stream, instrument.stream, sequencer.stream, midiMap.stream, mediaLibrary.stream),
	toggleUI,
	ping,
	studio,
	instrument,
	mediaLibrary,
	sequencer,
	midiMap,
	load,
	clear,
	initial
};
