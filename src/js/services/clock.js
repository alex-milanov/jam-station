'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const {context} = require('../util/audio');
const {measureToBeatLength, bpmToTime} = require('../util/math');
const pocket = require('../util/pocket');

// const tick$ = new Rx.Subject();
let i = 0;
let time = context.currentTime;
let length;
let modifier = 6;
let playing = false;

const setLength = time => {
	length = time / modifier;
};
setLength(bpmToTime(140));

const tick = () => {
	pocket.put('clockTick', {time, i});
	// tick$.onNext({time, i});
	time += length;
	i++;
	var diff = time - context.currentTime;
	if (playing) setTimeout(tick, diff * 1000);
};

const setTempo = bpm => {
	setLength(bpmToTime(bpm));
};

const play = bpm => {
	time = context.currentTime;
	setLength(bpmToTime(bpm));
	console.log({time});
	tick();
};

let unhook = () => {};

const hook = ({state$, actions}) => {
	let subs = [];

	subs.push(
		state$
			.distinctUntilChanged(state => state.studio.bpm)
			.subscribe(state => {
				setTempo(state.studio.bpm);
			})
		);

	subs.push(
		state$
			.distinctUntilChanged(state => state.studio.playing)
			.subscribe(state => {
				playing = state.studio.playing;
				if (playing) {
					play(state.studio.bpm);
				}
			})
	);

	subs.push(
		pocket.stream
			.filter(pocket => pocket.clockTick)
			.distinctUntilChanged(pocket => pocket.clockTick)
			.map(pocket => pocket.clockTick)
			.filter(({time, i}) => i % modifier === 0)
			.subscribe(({time}) => (playing) && actions.studio.tick(time))
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	// tick$,
	unhook
};
