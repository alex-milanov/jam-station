'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const a = require('../util/audio');

let changes$ = new Subject();

const initial = {
	vco1: a.vco({type: 'square'}),
	vco2: a.vco({type: 'square'}),
	vca1: a.vca({}),
	vcf1: a.vcf({}),
	volume: a.vca({gain: 0.7}),
	context: a.context
};

const modify = (node, prop, value) => {

};

const add = type => {

};

const connect = (source, dest) => {

};

const noteOn = () => {};

const noteOff = () => {};

const engine$ = changes$
	.startWith(() => initial)
	.scan((state, change) => change(state), {})
	.share();

const hook = ({state$, midi$, actions}) => {
	// hook state changes
	// hook midi signals
};

module.exports = {
	hook
};
