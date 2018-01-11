'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

const viewport = require('./viewport');
const layout = require('./layout');
const studio = require('./studio');
const instrument = require('./instrument');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');
const mediaLibrary = require('./media-library');
const pianoRoll = require('./piano-roll');

// util
const {obj} = require('iblokz-data');
const {measureToBeatLength} = require('../util/math');

// actions
const set = (key, value) => state => obj.patch(state, key, value);
const toggle = key => state => obj.patch(state, key, !obj.sub(state, key));

const toggleUI = editor => state => obj.patch(state, ['ui', editor], !state.ui[editor]);

const ping = () => state => state;

const initial = Object.assign({
	ui: {
		mediaLibrary: true,
		patches: true,
		instrument: true,
		sequencer: true,
		midiMap: true
	}
});

const changesMap = {
	studio: [[['tick', 'index'], ['tickIndex']]],
	sequencer: [],
	instrument
};

// todo merge loaded state
const load = content => state =>
	Object.keys(changesMap)
		.reduce((changes, key) => changes.concat([[key, key]], changesMap[key]), [])
		.reduce(
			(state, changes) =>
				obj.patch(state, changes[0], obj.sub(content, changes[1]) || obj.sub(state, changes[1])),
				state
		);

const clear = () => load(initial);

const change = (section, prop, val) => state =>
	obj.patch(state, [section].concat(prop), val);

module.exports = {
	initial,
	// children
	viewport,
	layout,
	studio,
	instrument,
	mediaLibrary,
	sequencer,
	pianoRoll,
	midiMap,
	// actions
	set,
	toggle,
	toggleUI,
	ping,
	load,
	clear,
	change
};
