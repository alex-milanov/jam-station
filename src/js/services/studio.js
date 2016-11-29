'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const {AudioContext} = require('../util/context');
const Sampler = require('../instr/sampler');
const obj = require('iblokz/common/obj');
const {measureToBeatLength} = require('../util/math');

const stream = new Subject();

let context = new AudioContext();
let kit = [
	'samples/kick01.ogg',
	'samples/hihat_opened02.ogg',
	'samples/snare01.ogg',
	'samples/clap01.ogg'
].map(url => new Sampler(context, url));

const tick = () => stream.onNext(
	state => obj.patch(state, ['studio', 'tickIndex'],
		(state.studio.tickIndex < state.studio.beatLength - 1) && (state.studio.tickIndex + 1) || 0
	)
);

const play = () => stream.onNext(state => obj.patch(state, 'studio', {playing: !state.studio.playing}));

const stop = () => stream.onNext(state => obj.patch(state, 'studio', {
	tickIndex: -1,
	playing: false
}));

const change = (prop, val) =>
	stream.onNext(state => [obj.patch(state, ['studio', prop], val)].map(
		state => (prop !== 'measure')
			? state
			: obj.patch(state, 'studio', {beatLength: measureToBeatLength(state.studio.measure)})
		).pop());

const studio = {
	stream,
	initial: {
		studio: {
			bpm: '120',
			measure: '4/4',
			beatLength: 16,
			playing: false,
			tickIndex: -1
		}
	},
	play,
	stop,
	change,
	tick
};

const attach = actions => Object.assign(
	{},
	actions,
	{
		studio,
		stream: $.merge(actions.stream, studio.stream),
		initial: Object.assign({}, actions.initial, studio.initial)
	}
);

const hook = ({state$, actions}) => {
	let playTime = new Rx.Subject();

	playTime.withLatestFrom(state$, (time, state) => ({time, state}))
		.subscribe(({state}) => state.pattern.forEach((row, i) => (row[state.studio.tickIndex]) && kit[i].play()));

	let intervalSub = null;

	state$
		.distinctUntilChanged(state => state.studio.playing)
		.subscribe(state => {
			if (state.studio.playing) {
				if (intervalSub === null) {
					intervalSub = $.interval(60 / parseInt(state.studio.bpm, 10) * 1000 / 4)
						.timeInterval().subscribe(time => {
							actions.studio.tick();
							playTime.onNext(time);
						});
				} else {
					intervalSub.dispose();
					intervalSub = null;
				}
			} else if (intervalSub) {
				intervalSub.dispose();
				intervalSub = null;
			}
		});

	state$
		.distinctUntilChanged(state => state.studio.bpm)
		.filter(state => state.studio.playing === true)
		.subscribe(state => {
			if (intervalSub) {
				intervalSub.dispose();
				intervalSub = $.interval(60 / parseInt(state.studio.bpm, 10) * 1000 / 4)
					.timeInterval().subscribe(time => {
						actions.studio.tick();
						playTime.onNext(time);
					});
			}
		});
};

module.exports = {
	context,
	attach,
	hook
};
