'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const {context} = require('../util/audio');
const Sampler = require('../instr/sampler');
const {measureToBeatLength, bpmToTime} = require('../util/math');

const stream = new Subject();

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

const hook = ({state$, actions, tick$}) => {
	let buffer = [];

	const clearBuffer = () => {
		// console.log(buffer);
		buffer.forEach(inst => inst.stop());
		buffer = [];
	};

	state$.distinctUntilChanged(state => state.studio.playing)
		.filter(state => !state.studio.playing)
		.subscribe(() => clearBuffer());

	state$.distinctUntilChanged(state => state.studio.bpm)
		.filter(state => state.studio.playing)
		.subscribe(() => clearBuffer());

	tick$
		.withLatestFrom(state$, (time, state) => ({time, state}))
		.filter(({state}) => state.studio.playing)
		.subscribe(({time}) => actions.studio.tick(time));

	state$
		.distinctUntilChanged(state => state.studio.tick)
		.filter(state => state.studio.playing)
		.subscribe(({studio, sequencer}) => {
			if (studio.tick.index === studio.beatLength - 1 || buffer.length === 0) {
				let start = (studio.tick.index === studio.beatLength - 1) ? 0 : studio.tick.index;
				let offset = buffer.length === 0 ? 0 : 1;

				for (let i = start; i < studio.beatLength; i++) {
					let timepos = studio.tick.time + ((i - start + offset) * bpmToTime(studio.bpm));
					sequencer.pattern[sequencer.bar].forEach((row, k) => {
						if (row[i]) {
							let inst = kit[sequencer.channels[k]].clone();
							inst.trigger({studio}, timepos);
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
};

module.exports = {
	context,
	kit,
	hook
};
