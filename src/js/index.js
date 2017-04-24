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
// gamepad
const gamepad = require('./util/gamepad');

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
const clock = require('./services/clock');
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
	.publish();

state$.scan((prev, state) => ({state, prev: prev.state || state}), {})
	// .map(state => (console.log(state), state))
	.filter(({state, prev}) => state.studio.tickIndex && (state.studio.tickIndex === prev.studio.tickIndex))
	.map(({state}) => state)
	.subscribe(state => (console.log(state), state));

// map state to ui
const ui$ = state$.map(state => ui({state, actions}));
clock.hook({state$, actions});
studio.hook({state$, actions, tick$: clock.tick$});
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
	$.concat(opmSamples.map(key =>
		$.fromCallback(studio.context.decodeAudioData, studio.context)(opm[key])
		.map(buffer => ({key, buffer})))
	)
		.subscribe(({key, buffer}) =>
			studio.kit.push(new Sampler(studio.context, key, buffer))
		);
	actions.mediaLibrary.loadSamples(opmSamples);
});

gamepad.changes()
	// .withLatestFrom(pressedKeys$, (pads, keys) => ({pads, keys}))
	.subscribe(pads => {
		console.log(pads[0]);
		if (pads[0]) {
			if (pads[0].buttons[8].pressed === true) actions.studio.play();
			if (pads[0].buttons[9].pressed === true) actions.studio.record();
			if (pads[0].buttons[3].pressed === true) actions.studio.stop();
			// channels
			if (pads[0].buttons[0].pressed === true) actions.sequencer.add();
			if (pads[0].buttons[2].pressed === true) actions.sequencer.clear();
			if (pads[0].buttons[1].pressed === true) actions.sequencer.remove();

			if (pads[0].axes[1] < 0) actions.sequencer.prev();
			if (pads[0].axes[1] > 0) actions.sequencer.next();
		}
	});

document.addEventListener('keydown', e => {
	console.log(e);
	if (e.code === 'Space') actions.studio.play();
	if (e.key === 'r') actions.studio.record();
	if (e.key === 't') actions.studio.stop();
	// channels
	if (e.key === 'Enter') actions.sequencer.add();
	if (e.key === 'Delete') actions.sequencer.clear();
	if (e.key === 'Backspace') actions.sequencer.remove();

	if (e.key === 'ArrowUp') actions.sequencer.prev();
	if (e.key === 'ArrowDown') actions.sequencer.next();
});

state$.connect();
