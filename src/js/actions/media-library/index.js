'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const obj = require('iblokz/common/obj');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

const remove = (arr, item) => arr.indexOf(item) > -1 ? [].concat(
	arr.slice(0, arr.indexOf(item)),
	arr.slice(arr.indexOf(item) + 1)
) : arr;

const add = (arr, item) => [].concat(arr, [item]);

const toggle = (arr, item) => arr.indexOf(item) > -1
	? remove(arr, item)
	: add(arr, item);

console.log(remove(add([], '2'), '2'));

const expand = group => stream.onNext(state => obj.patch(state, ['mediaLibrary'], {
	expanded: toggle(state.mediaLibrary.expanded, group)
}));

const initial = {
	expanded: [],
	samples: [
		'kick01.ogg',
		'kick02.ogg',
		'kick03.ogg',
		'kick_hiphop01.ogg',
		'hihat_opened02.ogg',
		'hihat_opened03.ogg',
		'ride02.ogg',
		'rim01.ogg',
		'snare01.ogg',
		'snare02.ogg',
		'snare03.ogg',
		'snare04.ogg',
		'snare05.ogg',
		'clap01.ogg',
		'clap02.ogg',
		'clap03.ogg',
		'clap04.ogg',
		'shaker01.ogg',
		'shaker02.ogg'
	],
	instruments: [
		{
			name: 'sampler'
		},
		{
			name: 'basicSynth'
		}
	]
};

module.exports = {
	stream,
	expand,
	initial
};
