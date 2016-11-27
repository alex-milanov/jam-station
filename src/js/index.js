'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const vdom = require('iblokz/adapters/vdom');
const {h, div, input, hr, p, button} = vdom;

const midi = require('./util/midi')();
const BasicSynth = require('./instr/basic-synth');

// app
const actions = require('./actions');
window.actions = actions;
const ui = require('./ui');
const services = require('./services');

// reduce actions to state
const state$ = actions.stream
	.scan((state, reducer) => reducer(state), {})
	.map(state => (console.log(state), state));

// map state to ui
const ui$ = state$.map(state => ui({state, actions}));

// patch stream to dom
vdom.patchStream(ui$, '#ui');

// services
services.init({actions});
state$.map(state => services.refresh({state, actions})).subscribe();

// midi map
const basicSynth = new BasicSynth(services.studio.context, 'C1');

let voices = {};

midi.access$.subscribe(actions.midiMap.connect);
midi.state$.subscribe(data => console.log('state', data));
midi.msg$.withLatestFrom(state$, (data, state) => ({data, state}))
	.subscribe(({data, state}) => {
		const midiMsg = midi.parseMidiMsg(data.msg);
		console.log('msg', data, midiMsg);
		if (data.msg && midiMsg.state === 'keyDown') {
			voices[midiMsg.note.pitch] = basicSynth.clone(midiMsg.note.pitch);
			voices[midiMsg.note.pitch].noteon(state.instrument, midiMsg.note.pitch, midiMsg.velocity);
		} else if (data.msg && midiMsg.state === 'keyUp' && voices[midiMsg.note.pitch]) {
			voices[midiMsg.note.pitch].noteoff(state.instrument, midiMsg.note.pitch);
		}
	});
