'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;
// util
const file = require('../util/file');
const audio = require('../util/audio');

const hook = ({state$, actions, studio}) => {
	file.loadZip('samples/openpathmusic.zip').subscribe(opm => {
		let opmSamples = Object.keys(opm);
		// console.log(opmSamples);
		$.concat(opmSamples.map(key =>
			$.fromCallback(studio.context.decodeAudioData, studio.context)(opm[key])
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
