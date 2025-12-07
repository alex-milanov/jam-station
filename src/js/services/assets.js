'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;
// util
const file = require('../util/file');
const audio = require('iblokz-audio');

const kits = [
	'samples/openpathmusic.zip',
	'samples/junk-drum-kit.zip'
];

const hook = ({state$, actions, studio}) => {
	$.fromArray(kits)
		.concatMap(file.loadZip)
		.subscribe(opm => {
			let opmSamples = Object.keys(opm);
			// console.log(opmSamples);
			$.concat(opmSamples.map(key =>
				$.fromCallback(audio.context.decodeAudioData, audio.context)(opm[key])
				.map(buffer => ({key, buffer})))
			)
				.subscribe(({key, buffer}) =>
					studio.addSample(key, buffer)
				);
			actions.mediaLibrary.loadSamples(opmSamples);
		});
};

module.exports = {
	hook
};
