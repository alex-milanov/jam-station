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
const {obj} = require('iblokz-data');
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
	mediaLibrary: mediaLibrary.initial,
	midiMap: midiMap.initial
});

const changesMap = {
	studio: [[['tick', 'index'], ['tickIndex']]],
	sequencer: [],
	instrument
};

// todo merge loaded state
const load = content => stream.onNext(state =>
	Object.keys(changesMap)
		.reduce((changes, key) => changes.concat([[key, key]], changesMap[key]), [])
		.reduce(
			(state, changes) =>
				obj.patch(state, changes[0], obj.sub(content, changes[1]) || obj.sub(state, changes[1])),
				state
		)
);
const clear = () => load(initial);

const change = (section, prop, val) => stream.onNext(state =>
	obj.patch(state, [section].concat(prop), val));

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
	change,
	initial
};
