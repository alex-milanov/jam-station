'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const {AudioContext} = require('../util/context');
const Sampler = require('../instr/sampler');
const {measureToBeatLength, bpmToTime} = require('../util/math');

const stream = new Subject();

let context = new AudioContext();
let kit = [
	'samples/kick01.ogg',
	'samples/kick02.ogg',
	'samples/kick03.ogg',
	'samples/kick_hiphop01.ogg',
	'samples/hihat_opened02.ogg',
	'samples/hihat_opened03.ogg',
	'samples/ride02.ogg',
	'samples/rim01.ogg',
	'samples/snare01.ogg',
	'samples/snare02.ogg',
	'samples/snare03.ogg',
	'samples/snare04.ogg',
	'samples/snare05.ogg',
	'samples/clap01.ogg',
	'samples/clap02.ogg',
	'samples/clap03.ogg',
	'samples/clap04.ogg',
	'samples/shaker01.ogg',
	'samples/shaker02.ogg'
].map(url => new Sampler(context, url));

const hook = ({state$, actions}) => {
	let playTime = new Rx.Subject();
	let buffer = [];

	const clearBuffer = () => {
		// console.log(buffer);
		buffer.forEach(inst => inst.stop());
		buffer = [];
	};

	playTime.withLatestFrom(state$, (time, state) => ({time, state}))
		.subscribe(({state, time}) => {
			// console.log(time);
			if (state.studio.tickIndex === 0 || time.value === 0) {
				let now = context.currentTime;
				// if (time.value === 0 || buffer.length === 0) {
				clearBuffer();
				for (let i = state.studio.tickIndex; i < state.studio.beatLength; i++) {
					let timepos = now + ((i - state.studio.tickIndex) * bpmToTime(state.studio.bpm));
					state.sequencer.pattern[state.sequencer.bar].forEach((row, k) => {
						if (row[i]) {
							let inst = kit[state.sequencer.channels[k]].clone();
							inst.trigger(state, timepos);
							buffer.push(inst);
						}
					});
				}
				// }
				// next index
				/*
				for (let i = 0; i < state.studio.beatLength; i++) {
					let timepos = now + ((state.studio.beatLength + i - state.studio.tickIndex) * bpmToTime(state.studio.bpm));
					state.sequencer.pattern[state.sequencer.bar].forEach((row, k) => {
						if (row[i]) {
							let inst = kit[state.sequencer.channels[k]].clone();
							inst.trigger(state, timepos);
							buffer.push(inst);
						}
					});
				}
				*/
			}
			/*
			state.pattern.forEach((row, i) => {
				(row[state.studio.tickIndex]) && kit[i].play()));
			}
			*/
		});

	let intervalSub = null;

	state$
		.distinctUntilChanged(state => state.studio.playing)
		.subscribe(state => {
			if (state.studio.playing) {
				if (intervalSub === null) {
					intervalSub = $.interval(bpmToTime(state.studio.bpm) * 1000)
						.timeInterval().subscribe(time => {
							actions.studio.tick();
							playTime.onNext(time);
						});
				} else {
					clearBuffer();
					intervalSub.dispose();
					intervalSub = null;
				}
			} else if (intervalSub) {
				clearBuffer();
				intervalSub.dispose();
				intervalSub = null;
			}
		});

	state$
		.distinctUntilChanged(state => state.studio.bpm)
		.filter(state => state.studio.playing === true)
		.subscribe(state => {
			if (intervalSub) {
				intervalSub.dispose();
				intervalSub = $.interval(bpmToTime(state.studio.bpm) * 1000)
					.timeInterval().subscribe(time => {
						actions.studio.tick();
						playTime.onNext(time);
					});
			}
		});
};

module.exports = {
	context,
	kit,
	hook
};
