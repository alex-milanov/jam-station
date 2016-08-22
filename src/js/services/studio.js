'use strict';

const {AudioContext} = require('../util/context');
const Sampler = require('../instr/sampler');

const init = () => {
	let context = new AudioContext();
	let kit = [
		'samples/kick01.ogg',
		'samples/hihat_opened02.ogg',
		'samples/snare01.ogg',
		'samples/clap01.ogg'
	].map(url => new Sampler(context, url));

	let playLoop = false;

	return {
		refresh: ({state, actions}) => {
			if (state.playing) {
				if (playLoop) {
					state.pattern.forEach((row, i) => (row[state.tickIndex]) && kit[i].play());
				} else {
					playLoop = setInterval(
						() => actions.tick(),
						60 / parseInt(state.bpm, 10) * 1000 / 4
					);
				}
			} else if (playLoop) {
				clearInterval(playLoop);
				playLoop = false;
			}
		}
	};
};

module.exports = {
	init
};
