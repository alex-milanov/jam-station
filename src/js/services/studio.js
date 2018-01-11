'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const audio = require('../util/audio');
const sampler = require('../util/audio/sources/sampler');
const {measureToBeatLength, bpmToTime} = require('../util/math');
const {obj} = require('iblokz-data');

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
].map(url => sampler.create(url));

const addSample = (key, buffer) => (
	kit.push(sampler.create(key, buffer))
);

const reverb = audio.create('reverb', {
	on: true,
	wet: 0.3,
	dry: 0.7
});

audio.connect(reverb, audio.context.destination);

const hook = ({state$, actions, tick$}) => {
	let buffer = [];

	const clearBuffer = () => {
		// console.log(buffer);
		buffer.forEach(inst => {
			inst.output.disconnect(reverb.input);
			audio.stop(inst);
		});
		buffer = [];
	};

	state$.distinctUntilChanged(state => state.studio.playing)
		.filter(state => !state.studio.playing)
		.subscribe(() => clearBuffer());

	state$.distinctUntilChanged(state => state.studio.bpm)
		.filter(state => state.studio.playing)
		.subscribe(() => clearBuffer());

	state$
		.distinctUntilChanged(state => state.studio.tick)
		.filter(state => state.studio.playing)
		.subscribe(({studio, sequencer}) => {
			if (studio.tick.index === studio.beatLength - 1 || buffer.length === 0) {
				let start = (studio.tick.index === studio.beatLength - 1) ? 0 : studio.tick.index;
				// let start = studio.tick.index;
				let offset = buffer.length === 0 ? 0 : 1;

				for (let i = start; i < studio.beatLength; i++) {
					let timepos = studio.tick.time + ((i - start + offset) * bpmToTime(studio.bpm));
					// console.log({timepos, start, offset, i});
					sequencer.pattern[
						(studio.tick.index === studio.beatLength - 1)
							? (studio.tick.bar < studio.barsLength - 1) ? studio.tick.bar + 1 : 0
							: studio.tick.bar
					].forEach((row, k) => {
						if (row[i]) {
							let inst = sampler.clone(kit[sequencer.channels[k]]);
							audio.connect(inst, reverb);
							audio.start(inst, timepos);
							// inst.trigger({studio}, timepos);
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

	let voices = {};
	const notesPattern = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	state$.distinctUntilChanged(state => state.midiMap.channels)
		.map(state => ({
			state,
			pressed: Object.keys(state.midiMap.channels).filter(ch => parseInt(ch, 10) === 10).reduce(
				(pressed, ch) => Object.assign({}, pressed, state.midiMap.channels[ch]),
				{}
			)
		}))
		.subscribe(({state, pressed}) => {
			// console.log(pressed);
			Object.keys(pressed).filter(note => !voices[note])
				.forEach(
					note => {
						const index = notesPattern.indexOf(note.replace(/[0-9]/, ''));
						if (index > -1 && state.sequencer.channels[index]) {
							let inst = sampler.clone(kit[state.sequencer.channels[index]]);
							audio.connect(inst, reverb);
							setTimeout(() => audio.start(inst));
							voices[note] = inst;
						}
					}
				);
			Object.keys(voices).filter(note => !pressed[note])
				.forEach(
					note => {
						if (voices[note]) {
							setTimeout(() => {
								voices[note].output.disconnect(reverb.input);
								audio.stop(voices[note]);
								voices = obj.filter(voices, key => key !== note);
							});
						}
					}
				);
		});
};

module.exports = {
	kit,
	addSample,
	hook
};
