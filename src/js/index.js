'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const vdom = require('./util/vdom');
const {h, div, input, hr, p, button} = vdom;

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

// patch stream to dom
vdom.patchStream(ui$, '#ui');
