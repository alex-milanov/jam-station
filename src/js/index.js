'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;
const vdom = require('iblokz-snabbdom-helpers');

// util
const midi = require('./util/midi')();
const a = require('./util/audio');
window.a = a;

// vex code
const vex = require('vex-js');
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-top';

// tap tempo
const tapTempo = require('tap-tempo')();

// app
const app = require('./util/app');
let actions = require('./actions');
let ui = require('./ui');
let actions$;

// services
const services = require('./services');
const clock = require('./services/clock');
const studio = require('./services/studio');
const audio = require('./services/audio');
const controls = require('./services/controls');
const assets = require('./services/assets');
// actions = studio.attach(actions);

// adapt actions
actions = app.adapt(actions);

// hot reloading
if (module.hot) {
	// actions
	actions$ = $.fromEventPattern(
    h => module.hot.accept("./actions", h)
	).flatMap(() => {
		actions = app.adapt(require('./actions'));
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
	.map(state => (console.log(state), state))
	.publish();

// map state to ui
const ui$ = state$.map(state => ui({state, actions, tapTempo}));
clock.hook({state$, actions});
studio.hook({state$, actions, tick$: clock.tick$});
audio.hook({state$, midi, actions, studio, tapTempo, tick$: clock.tick$});

// patch stream to dom
vdom.patchStream(ui$, '#ui');

// services
services.init({actions});
state$.map(state => services.refresh({state, actions})).subscribe();

assets.hook(state$, actions, studio);
controls.hook(state$, actions);

// tap tempo
tapTempo.on('tempo', tempo => actions.studio.change('bpm', tempo));

state$.connect();
