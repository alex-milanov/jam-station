'use strict';

const audio = require('iblokz-audio');
const sampler = require('iblokz-audio').sampler;
const {measureToBeatLength, bpmToTime} = require('../util/math');
const {obj} = require('iblokz-data');
const pocket = require('../util/pocket');

const {Subject} = require('rxjs');
const stream = new Subject();

const reverb = audio.create('reverb', {
	on: true,
	wet: 0.1,
	dry: 0.9
});

audio.connect(reverb, audio.context.destination);

const {filter, distinctUntilChanged, map} = require('rxjs/operators');

const hook = ({state$, actions}) => {
	const sampleBank$ = pocket.stream.pipe(
		filter(p => p.sampleBank),
		distinctUntilChanged((prev, curr) => {
			const prevBank = prev.sampleBank;
			const currBank = curr.sampleBank;
			return prevBank === currBank;
		}),
		map(p => p.sampleBank)
	);

	let buffer = [];

	const clearBuffer = () => {
		// console.log(buffer);
		buffer.forEach(inst => {
			inst.output.disconnect(reverb.input);
			audio.stop(inst);
		});
		buffer = [];
	};

	// state$.distinctUntilChanged(state => state.studio.playing)
	// 	.filter(state => !state.studio.playing)
	// 	.subscribe(() => clearBuffer());

	// state$.distinctUntilChanged(state => state.studio.bpm)
	// 	.filter(state => state.studio.playing)
	// 	.subscribe(() => clearBuffer());

	// state$
	// 	.distinctUntilChanged(state => state.studio.tick)
	// 	.filter(state => state.studio.playing)
	// 	.combineLatest(sampleBank$, (state, sampleBank) => ({state, sampleBank}))
	// 	.subscribe(({state: {mediaLibrary, studio, sequencer}, sampleBank}) => {
	// 		if (studio.tick.index === studio.beatLength - 1 || buffer.length === 0) {
	// 			let start = (studio.tick.index === studio.beatLength - 1) ? 0 : studio.tick.index;
	// 			// let start = studio.tick.index;
	// 			let offset = buffer.length === 0 ? 0 : 1;
	//
	// 			for (let i = start; i < studio.beatLength; i++) {
	// 				let timepos = studio.tick.time + ((i - start + offset) * bpmToTime(studio.bpm));
	// 				// console.log({timepos, start, offset, i});
	// 				sequencer.pattern[
	// 					(studio.tick.index === studio.beatLength - 1)
	// 						? (studio.tick.bar < sequencer.barsLength - 1) ? studio.tick.bar + 1 : 0
	// 						: studio.tick.bar
	// 				].forEach((row, k) => {
	// 					if (row[i]) {
	// 						console.log(sequencer.channels[k]);
	// 						let inst = sampler.clone(sampleBank[
	// 							mediaLibrary.files[
	// 								sequencer.channels[k]
	// 							]
	// 						]);
	// 						audio.connect(inst, reverb);
	// 						audio.start(inst, timepos);
	// 						// inst.trigger({studio}, timepos);
	// 						buffer.push(inst);
	// 					}
	// 				});
	// 			}
	// 			// }
	// 			// next index
	// 			/*
	// 			for (let i = 0; i < state.studio.beatLength; i++) {
	// 				let timepos = now + ((state.studio.beatLength + i - state.studio.tickIndex) * bpmToTime(state.studio.bpm));
	// 				state.sequencer.pattern[state.sequencer.bar].forEach((row, k) => {
	// 					if (row[i]) {
	// 						let inst = kit[state.sequencer.channels[k]].clone();
	// 						inst.trigger(state, timepos);
	// 						buffer.push(inst);
	// 					}
	// 				});
	// 			}
	// 			*/
	// 		}
	// 		/*
	// 		state.pattern.forEach((row, i) => {
	// 			(row[state.studio.tickIndex]) && kit[i].play()));
	// 		}
	// 		*/
	// 	});

	// let voices = {};
	// const notesPattern = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	//
	// state$.distinctUntilChanged(state => state.midiMap.channels)
	// 	.map(state => ({
	// 		state,
	// 		pressed: Object.keys(state.midiMap.channels).filter(ch => parseInt(ch, 10) === 10).reduce(
	// 			(pressed, ch) => Object.assign({}, pressed, state.midiMap.channels[ch]),
	// 			{}
	// 		)
	// 	}))
	// 	.combineLatest(sampleBank$, ({state, pressed}, sampleBank) => ({state, pressed, sampleBank}))
	// 	.subscribe(({state, pressed, sampleBank}) => {
	// 		// console.log(pressed);
	// 		Object.keys(pressed).filter(note => !voices[note])
	// 			.forEach(
	// 				note => {
	// 					const index = notesPattern.indexOf(note.replace(/[0-9]/, ''));
	// 					if (index > -1 && state.sequencer.channels[index]) {
	// 						let inst = sampler.clone(sampleBank[
	// 							state.mediaLibrary.files[
	// 								state.sequencer.channels[index]
	// 							]
	// 						]);
	// 						audio.connect(inst, reverb);
	// 						setTimeout(() => audio.start(inst));
	// 						voices[note] = inst;
	// 					}
	// 				}
	// 			);
	// 		Object.keys(voices).filter(note => !pressed[note])
	// 			.forEach(
	// 				note => {
	// 					if (voices[note]) {
	// 						setTimeout(() => {
	// 							voices[note].output.disconnect(reverb.input);
	// 							audio.stop(voices[note]);
	// 							voices = obj.filter(voices, key => key !== note);
	// 						});
	// 					}
	// 				}
	// 			);
	// 	});
};

module.exports = {
	hook
};
