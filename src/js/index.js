'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const vdom = require('./util/vdom');
const {h, div, input, hr, p, button} = vdom;

const midi = require('./util/midi')();
const BasicSynth = require('./instr/basic-synth');

const studio = require('./services/studio').init();

const actions = require('./actions');
window.actions = actions;

const ui = require('./ui');

// reduce actions to state
const state$ = actions.stream
	.scan((state, reducer) => reducer(state), {})
	.map(state => (console.log(state), state));

// map state to ui
const ui$ = state$.map(state => ui({state, actions}));

// services
state$.map(state => studio.refresh({state, actions})).subscribe();

// midi map
const basicSynth = new BasicSynth(studio.context, 'C1');

midi.access$.subscribe(data => console.log('access', data));
midi.state$.subscribe(data => console.log('state', data));
midi.msg$.subscribe(data => {
	console.log('msg', data);
	if (data.msg && midi.parseMidiMsg(data.msg).state === 'keyDown') {
		console.log(data.msg);
		basicSynth.clone().play(midi.parseMidiMsg(data.msg).note.pitch);
	}
});
// patch stream to dom
vdom.patchStream(ui$, '#ui');
