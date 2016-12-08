'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const vdom = require('iblokz/adapters/vdom');
const {h, div, input, hr, p, button} = vdom;

const midi = require('./util/midi')();
const BasicSynth = require('./instr/basic-synth');

// app
let actions = require('./actions');
const ui = require('./ui');

// services
const services = require('./services');
const studio = require('./services/studio');
// actions = studio.attach(actions);
window.actions = actions;

// reduce actions to state
const state$ = actions.stream
	.scan((state, change) => change(state), actions.initial)
	.share();

state$.scan((prev, state) => ({state, prev: prev.state || state}), {})
	// .map(state => (console.log(state), state))
	.filter(({state, prev}) => state.studio.tickIndex && (state.studio.tickIndex === prev.studio.tickIndex))
	.map(({state}) => state)
	.subscribe(state => (console.log(state), state));

// map state to ui
const ui$ = state$.map(state => ui({state, actions}));
studio.hook({state$, actions});

// patch stream to dom
vdom.patchStream(ui$, '#ui');

// services
services.init({actions});
state$.map(state => services.refresh({state, actions})).subscribe();

// midi map
const basicSynth = new BasicSynth(studio.context, 'C1');

let voices = {};

let midiMap = {
	22: ['studio', 'bpm', 60, 200, 0],
	23: ['studio', 'volume'],
	24: ['instrument', 'eg', 'attack'],
	25: ['instrument', 'eg', 'decay'],
	26: ['instrument', 'eg', 'sustain'],
	27: ['instrument', 'eg', 'release']
};

midi.access$.subscribe(actions.midiMap.connect);
midi.state$.subscribe(data => console.log('state', data));
midi.msg$.withLatestFrom(state$, (data, state) => ({data, state}))
	.subscribe(({data, state}) => {
		const midiMsg = midi.parseMidiMsg(data.msg);
		console.log('msg', data, midiMsg);
		if (data.msg && midiMsg.state === 'noteOn') {
			voices[midiMsg.note.pitch] = basicSynth.clone(midiMsg.note.pitch);
			voices[midiMsg.note.pitch].noteon(state, midiMsg.note.pitch, midiMsg.velocity);
		} else if (data.msg && midiMsg.state === 'noteOff' && voices[midiMsg.note.pitch]) {
			voices[midiMsg.note.pitch].noteoff(state, midiMsg.note.pitch);
		} else if (data.msg && midiMsg.state === 'controller') {
			let mmap = midiMap[midiMsg.controller];
			if (mmap[0] === 'instrument') {
				let value = parseFloat(
					(mmap[4] || 0) + midiMsg.value * (mmap[4] || 1) - midiMsg.value * (mmap[3] || 0)
				).toFixed(mmap[5] || 3);
				value = (mmap[5] === 0) ? parseInt(value, 10) : parseFloat(value);
				actions.instrument.updateProp(mmap[1], mmap[2], value);
			}
			if (mmap[0] === 'studio') {
				let value = parseFloat(
					(mmap[2] || 0) + midiMsg.value * (mmap[3] || 1) - midiMsg.value * (mmap[2] || 0)
				).toFixed(mmap[4] || 3);
				value = (mmap[4] === 0) ? parseInt(value, 10) : parseFloat(value);
				actions.studio.change(mmap[1], value);
			}
		}
	});
