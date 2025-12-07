'use strict';
// lib
const {from} = require('rxjs');
const {concatMap} = require('rxjs/operators');
// util
const file = require('../util/file');
const audio = require('iblokz-audio');

const kits = [
	'samples/openpathmusic.zip',
	'samples/junk-drum-kit.zip'
];

const {concat} = require('rxjs');
const {map} = require('rxjs/operators');

const hook = ({state$, actions, studio}) => {
	from(kits).pipe(
		concatMap(file.loadZip)
	).subscribe(opm => {
		let opmSamples = Object.keys(opm);
		// console.log(opmSamples);
		concat(...opmSamples.map(key =>
			from(new Promise((resolve, reject) => {
				audio.context.decodeAudioData(opm[key], resolve, reject);
			})).pipe(
				map(buffer => ({key, buffer}))
			)
		)).subscribe(({key, buffer}) =>
			studio.addSample(key, buffer)
		);
		actions.mediaLibrary.loadSamples(opmSamples);
	});
};

module.exports = {
	hook
};
