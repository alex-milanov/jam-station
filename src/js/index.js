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

// Expose actions and state for testing (after they're created)
if (typeof window !== 'undefined') {
	window.__jamStationActions = actions;
	window.__jamStationState$ = state$;
}

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
// if (module.hot) {
// 	document.write(`<script src="http://${(location.host || 'localhost').split(':')[0]}` +
// 	`:35729/livereload.js?snipver=1"></script>`);
// }

const testEvents = [
	{uuid: 'event-1', note: 'C3', start: 2, duration: 1, velocity: 0.8, startTime: 0}, // Column 2, C3 (snapped)
	{uuid: 'event-2', note: 'E3', start: 2.3, duration: 1, velocity: 0.8, startTime: 0}, // Column 2, E3 (unsnapped, same column as event-1)
	{uuid: 'event-3', note: 'D3', start: 4, duration: 1, velocity: 0.8, startTime: 0}, // Column 4, D3 (snapped)
	{uuid: 'event-4', note: 'G3', start: 6.7, duration: 1, velocity: 0.8, startTime: 0}, // Column 6, G3 (unsnapped)
	{uuid: 'event-5', note: 'A3', start: 8, duration: 1, velocity: 0.8, startTime: 0}, // Column 8, A3 (snapped)
	{uuid: 'event-6', note: 'B3', start: 10.2, duration: 1, velocity: 0.8, startTime: 0}, // Column 10, B3 (unsnapped)
	{uuid: 'event-7', note: 'C3', start: 12, duration: 1, velocity: 0.8, startTime: 0}, // Column 12, C3 (snapped, same note as event-1)
	{uuid: 'event-8', note: 'F3', start: 14.5, duration: 1, velocity: 0.8, startTime: 0}  // Column 14, F3 (unsnapped)
];

// setTimeout(() => {
// 	actions.pianoRoll.clear();
// 	actions.set('pianoRoll', {events: testEvents});
// }, 4000);