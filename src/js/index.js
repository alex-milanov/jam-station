'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const vdom = require('iblokz-snabbdom-helpers');
const {h, div, input, hr, p, button} = vdom;

const midi = require('./util/midi')();
const a = require('./util/audio');
window.a = a;
const f = require('./util/file');
window.f = f;
const BasicSynth = require('./instr/basic-synth');
const Sampler = require('./instr/sampler');

// vex code
const vex = require('vex-js');
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-top';

// app
let actions = require('./actions');
let ui = require('./ui');
let actions$;

// services
const services = require('./services');
const studio = require('./services/studio');
const audio = require('./services/audio');
// actions = studio.attach(actions);

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = require('./actions');
		return actions.stream.startWith(state => state);
	}).merge(actions.stream);
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		actions.ping();
	});
} else {
	actions$ = actions.stream;
}
// reduce actions to state
const state$ = actions$
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	.share();

state$.scan((prev, state) => ({state, prev: prev.state || state}), {})
	// .map(state => (console.log(state), state))
	.filter(({state, prev}) => state.studio.tickIndex && (state.studio.tickIndex === prev.studio.tickIndex))
	.map(({state}) => state)
	.subscribe(state => (console.log(state), state));

// map state to ui
const ui$ = state$.map(state => ui({state, actions}));
studio.hook({state$, actions});
audio.hook({state$, midi, actions, studio});

// patch stream to dom
vdom.patchStream(ui$, '#ui');

// services
services.init({actions});
state$.map(state => services.refresh({state, actions})).subscribe();

// files
f.loadZip('samples/openpathmusic.zip').subscribe(opm => {
	let opmSamples = Object.keys(opm);
	// console.log(opmSamples);
	$.concat(opmSamples.map(key => $
		.fromCallback(studio.context.decodeAudioData, studio.context)(opm[key])
		.map(buffer => ({key, buffer})))
	)
		.subscribe(({key, buffer}) =>
			studio.kit.push(new Sampler(studio.context, key, buffer))
		);
	actions.mediaLibrary.loadSamples(opmSamples);
});

let files = [];

// midi map
const basicSynth = new BasicSynth(studio.context, 'C1');

let voices = {};

/*
midi.msg$.withLatestFrom(state$, (data, state) => ({data, state}))
	.subscribe(({data, state}) => {
		const midiMsg = midi.parseMidiMsg(data.msg);
		// if (midiMsg.state !== false)
		console.log('msg', data, midiMsg);

		switch (midiMsg.state) {
			case 'noteOn':
				if (midiMsg.channel === 10) {
					if (state.sequencer.channels[midiMsg.note.midi - 60])
						studio.kit[state.sequencer.channels[midiMsg.note.midi - 60]].clone().trigger({
							studio: {volume: state.studio.volume * midiMsg.velocity}
						});
				} else {
					// voices[midiMsg.note.pitch] = basicSynth.clone(midiMsg.note.pitch);
					// voices[midiMsg.note.pitch].noteon(state, midiMsg.note.pitch, midiMsg.velocity);
				}
				break;
			case 'noteOff':
				if (midiMsg.channel === 10) {

				}
				break;
			case 'controller':
				{
					let mmap = midiMap[midiMsg.controller];
					if (mmap && mmap[0] === 'instrument') {
						let value = parseFloat(
							(mmap[4] || 0) + midiMsg.value * (mmap[4] || 1) - midiMsg.value * (mmap[3] || 0)
						).toFixed(mmap[5] || 3);
						value = (mmap[5] === 0) ? parseInt(value, 10) : parseFloat(value);
						if (mmap[1] === 'eq') {
							let vcaNum = `vca${state.instrment.vcaOn + 1}`;
							actions.instrument.updateProp(vcaNum, mmap[2], value);
						} else {
							actions.instrument.updateProp(mmap[1], mmap[2], value);
						}
					}
					if (mmap && mmap[0] === 'studio') {
						let value = parseFloat(
							(mmap[2] || 0) + midiMsg.value * (mmap[3] || 1) - midiMsg.value * (mmap[2] || 0)
						).toFixed(mmap[4] || 3);
						value = (mmap[4] === 0) ? parseInt(value, 10) : parseFloat(value);
						actions.studio.change(mmap[1], value);
					}
				}
				break;
			default:
				break;
		}
	});
	*/
