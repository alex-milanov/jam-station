'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const obj = require('iblokz/common/obj');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

const initial = {
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
	]
};

module.exports = {
	stream,
	initial
};
