'use strict';

const viewport = require('./viewport');
const layout = require('./layout');
const studio = require('./studio');
const session = require('./session');
const instrument = require('./instrument');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');
const mediaLibrary = require('./media-library');
const pianoRoll = require('../services/piano-roll');
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
	},
	myo: {
		on: false,
		reverse: false,
		osc: {

		}
	},
	wrlds: {
		on: false,
		port: 8888,
		mode: 0,
		threshold: 50,
		rotation: []
	}
});

const changesMap = {
	studio: [
		[['tick', 'index'], ['tickIndex']]
	],
	sequencer: [],
	instrument: [],
	session: [
		[
			'tracks', tracks => tracks.map(track => Object.assign({
				input: {
					device: -1,
					channel: track.type === 'seq' ? 10 : 1
				},
				inst: instrument.initial
			}, track))
		]
	],
	pianoRoll: []
};

// todo merge loaded state
const load = content => state => obj.patch(
	Object.keys(changesMap)
		.reduce((changes, key) =>
			changes.concat([[key, key]], changesMap[key].map(
				change => change.map(ch =>
					(ch instanceof Array || typeof ch === 'string')
						? [].concat(key, ch) : ch)
			)),
			[]
		)
		.map(changes => (console.log(changes), changes))
		.reduce(
			(state, changes) =>
				obj.patch(state, changes[0],
					changes[1] instanceof Function
						? changes[1](obj.sub(content, changes[0]))
						: obj.sub(content, changes[1]) || obj.sub(state, changes[1])),
				state
		),
	['studio', 'playing'], false
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
	session,
	sequencer,
	pianoRoll: {initial: pianoRoll.actions.initial},
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
