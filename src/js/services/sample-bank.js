'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const {obj, fn} = require('iblokz-data');
const file = require('../util/file');
const {context} = require('../util/audio');
const sampler = require('../util/audio/sources/sampler');
const {measureToBeatLength, bpmToTime} = require('../util/math');
const pocket = require('../util/pocket');

const baseKit = [
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
];

let sampleBank$ = new Rx.Subject();

let unhook = () => {};

const hook = ({state$, actions}) => {
	let subs = [];

	const samples$ = $.concat(
		$.fromArray(baseKit)
			.concatMap(url => $.fromPromise(fetch(url)
				.then(res => res.arrayBuffer()))
				.concatMap(buffer => $.fromCallback(context.decodeAudioData, context)(buffer))
				.map(buffer => ({
					name: url,
					node: sampler.create(url, buffer)
				}))
			),
		file.loadZip('samples/openpathmusic.zip')
			.concatMap(opm => $.fromArray(Object.keys(opm))
				.concatMap(key => $.fromCallback(context.decodeAudioData, context)(opm[key])
					.map(buffer => ({
						name: key,
						node: sampler.create(key, buffer)
					}))))
	).share();

	subs.push(
		samples$
			.subscribe(sample => actions.mediaLibrary.loadSamples([sample.name]))
	);
	subs.push(
		samples$
			.subscribe(sample => pocket.put(['sampleBank', sample.name], sample.node))
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook,
	sampleBank$
};
