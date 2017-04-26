'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const {context} = require('../util/audio');
const {measureToBeatLength, bpmToTime} = require('../util/math');

const tick$ = new Rx.Subject();
let i = 0;
let time = context.currentTime;
let length = bpmToTime(120);

const tick = () => {
	tick$.onNext({time, i});
	time += length;
	i++;
	var diff = time - context.currentTime;
	setTimeout(tick, diff * 1000);
};

tick();

const setTempo = bpm => {
	length = bpmToTime(bpm);
};

const hook = ({state$, actions}) => {
	state$
		.distinctUntilChanged(state => state.studio.bpm)
		.subscribe(state => {
			setTempo(state.studio.bpm);
		});
};

module.exports = {
	tick$,
	hook
};
