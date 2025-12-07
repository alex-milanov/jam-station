'use strict';

const {Subject, concat, from, EMPTY} = require('rxjs');
const {concatMap, mergeMap, map, filter, catchError} = require('rxjs/operators');

const {obj, fn} = require('iblokz-data');
const file = require('../util/file');
const {context} = require('iblokz-audio');
const sampler = require('iblokz-audio').sampler;
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

const kits = [
	'samples/openpathmusic.zip',
	'samples/junk-drum-kit.zip'
];

let sampleBank$ = new Subject();

let unhook = () => {};

const hook = ({state$, actions}) => {
	let subs = [];

	const {share} = require('rxjs/operators');
	const samples$ = concat(
		from(baseKit).pipe(
			concatMap(url => from(fetch(url)).pipe(
				concatMap(res => {
					if (!res.ok) {
						console.warn(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
						return EMPTY;
					}
					return from(res.arrayBuffer());
				}),
				concatMap(buffer => from(context.decodeAudioData(buffer)).pipe(
					map(buffer => ({
						name: url,
						node: sampler.create(url, buffer)
					})),
					catchError(err => {
						console.warn(`Failed to decode ${url}:`, err);
						return EMPTY;
					})
				)),
				catchError(err => {
					console.warn(`Failed to load ${url}:`, err);
					return EMPTY;
				})
			))
		),
		from(kits).pipe(
			concatMap(file.loadZip),
			concatMap(opm => from(Object.keys(opm)).pipe(
				filter(key => key.match(/.(wav|ogg|opus|mp3|aif)$/)),
				concatMap(key => from(context.decodeAudioData(opm[key])).pipe(
					map(buffer => ({
						name: key,
						node: sampler.create(key, buffer)
					})),
					catchError(err => {
						console.warn(`Failed to decode ${key}:`, err);
						return EMPTY;
					})
				))
			))
		)
	).pipe(share());

	subs.push(
		samples$.subscribe(sample => actions.mediaLibrary.loadSamples([sample.name]))
	);
	subs.push(
		samples$.subscribe(sample => pocket.put(['sampleBank', sample.name], sample.node))
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook,
	sampleBank$
};
