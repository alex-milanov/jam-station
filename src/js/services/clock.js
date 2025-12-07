'use strict';

const {context} = require('iblokz-audio');
const {measureToBeatLength, bpmToTime} = require('../util/math');
const pocket = require('../util/pocket');
const {distinctUntilChanged, filter, map} = require('rxjs/operators');

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
	// console.log({time});
	tick();
};

let unhook = () => {};

const hook = ({state$, actions}) => {
	let subs = [];

	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => prev.studio.bpm === curr.studio.bpm)
		).subscribe(state => {
			setTempo(state.studio.bpm);
		})
	);

	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => prev.studio.playing === curr.studio.playing)
		).subscribe(state => {
			playing = state.studio.playing;
			if (playing) {
				play(state.studio.bpm);
			}
		})
	);

	subs.push(
		pocket.stream.pipe(
			filter(p => p.clockTick),
			distinctUntilChanged((prev, curr) => {
				const prevTick = prev.clockTick;
				const currTick = curr.clockTick;
				return prevTick && currTick && prevTick.time === currTick.time && prevTick.i === currTick.i;
			}),
			map(p => p.clockTick),
			filter(({time, i}) => i % modifier === 0)
		).subscribe(({time}) => (playing) && actions.studio.tick(time))
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	// tick$,
	unhook
};
