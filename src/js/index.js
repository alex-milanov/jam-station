// lib
const vdom = require('iblokz-snabbdom-helpers');

// iblokz
const {createState, attach} = require('iblokz-state');

// util
const a = require('iblokz-audio');
window.a = a;

// vex code
const vex = require('vex-js');
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-top';

// tap tempo
const tapTempo = require('tap-tempo')();

// app
let actionsTree = require('./actions');
let {actions, state$} = createState(actionsTree);

// Attach service actions
const pianoRoll = require('./services/piano-roll');
actions = attach(actions, 'pianoRoll', pianoRoll.actions);

let ui = require('./ui');

// services
let services = require('./services');

// hot reloading
if (module.hot) {
	// actions
	module.hot.accept("./actions", function() {
		actionsTree = require('./actions');
		const result = createState(actionsTree);
		actions = result.actions;
		// Trigger a re-render with current state
		actions.stream.next({path: ['_reload'], payload: []});
	});
	// ui
	module.hot.accept("./ui", function() {
		ui = require('./ui');
		// Trigger a re-render with current state
		actions.stream.next({path: ['_reload'], payload: []});
	});
	// services
	module.hot.accept("./services", function() {
		// services = require('./services');
		// services.hook({state$, actions, tapTempo});
	});
}

// map state to ui
const {map} = require('rxjs/operators');
const ui$ = state$.pipe(
	map(state => ui({state, actions, tapTempo, context: a.context}))
);

// services
services.hook({state$, actions, tapTempo});

// Request permissions on page load - browser will show native prompts
// Audio context resume
if (a.context.state === 'suspended') {
	a.context.resume().catch(err => {
		console.error('Failed to resume audio context:', err);
	});
}

// MIDI access
if (navigator.requestMIDIAccess) {
	navigator.requestMIDIAccess().catch(err => {
		console.error('Failed to request MIDI access:', err);
	});
}

// patch stream to dom
vdom.patchStream(ui$, '#ui');

// services
// services.init({actions});
// state$.map(state => services.refresh({state, actions})).subscribe();

// debug

// state$.distinctUntilChanged(state => state.mediaLibrary)
// 	.subscribe(state => console.log(state.mediaLibrary));

// tap tempo
tapTempo.on('tempo', tempo => actions.studio.change('bpm', tempo.toPrecision(5)));

// state$.connect();

// livereload impl.
if (module.hot) {
	document.write(`<script src="http://${(location.host || 'localhost').split(':')[0]}` +
	`:35729/livereload.js?snipver=1"></script>`);
}
