'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;
const vdom = require('iblokz-snabbdom-helpers');

// util
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
const state$ = new Rx.BehaviorSubject();

// services
let services = require('./services');
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
		// actions.ping();
	});
	// services
	module.hot.accept("./services", function() {
		// services = require('./services');
		// services.hook({state$, actions, tapTempo});
		// actions.stream.onNext(state => state);
	});
} else {
	actions$ = actions.stream;
}
// reduce actions to state
actions$
	/*
	.map(action => (
		action.path && console.log(action.path.join('.'), action.payload),
		console.log(action),
		action)a
	)
	*/
	.startWith(() => actions.initial)
	.scan((state, change) => change(state), {})
	// .map(state => (console.log(state), state))
	.subscribe(state => state$.onNext(state));

// map state to ui
const ui$ = state$.map(state => ui({state, actions, tapTempo, context: a.context}));

// services
services.hook({state$, actions, tapTempo});

// patch stream to dom
vdom.patchStream(ui$, '#ui');

// services
// services.init({actions});
// state$.map(state => services.refresh({state, actions})).subscribe();

// debug

// state$.distinctUntilChanged(state => state.midiMap)
// 	.subscribe(state => console.log(state.midiMap));

// tap tempo
tapTempo.on('tempo', tempo => actions.studio.change('bpm', tempo.toPrecision(5)));

// state$.connect();

// livereload impl.
if (module.hot) {
	document.write(`<script src="http://${(location.host || 'localhost').split(':')[0]}` +
	`:35729/livereload.js?snipver=1"></script>`);
}
