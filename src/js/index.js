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

midi.access$.subscribe(actions.midiMap.connect);
midi.state$.subscribe(data => console.log('state', data));
midi.msg$.withLatestFrom(state$, (data, state) => ({data, state}))
	.subscribe(({data, state}) => {
		const midiMsg = midi.parseMidiMsg(data.msg);
		console.log('msg', data, midiMsg);
		if (data.msg && midiMsg.state === 'noteOn') {
			voices[midiMsg.note.pitch] = basicSynth.clone(midiMsg.note.pitch);
			voices[midiMsg.note.pitch].noteon(state.instrument, midiMsg.note.pitch, midiMsg.velocity);
		} else if (data.msg && midiMsg.state === 'noteOff' && voices[midiMsg.note.pitch]) {
			voices[midiMsg.note.pitch].noteoff(state.instrument, midiMsg.note.pitch);
		}
	});
