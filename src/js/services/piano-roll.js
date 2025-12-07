'use strict';
// lib
const {combineLatest, interval} = require('rxjs');
const {distinctUntilChanged, map, withLatestFrom, filter} = require('rxjs/operators');

const {obj} = require('iblokz-data');

// const time = require('../util/time');
const audio = require('iblokz-audio');
const gfxCanvas = require('../util/gfx/canvas');
const {numberToNote, noteToNumber} = require('../util/midi');

const prepCanvas = ctx => (
	gfxCanvas.clear(ctx),
	gfxCanvas.refresh(ctx)
);

const notesPattern = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const drawGrid = (ctx, dim = [42, 14], pos = [0, 60]) => {
	console.log('drawing grid');
	prepCanvas(ctx);
	const pattern = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
	const colCount = parseInt(ctx.canvas.width / dim[0], 10) + 1;
	const rowCount = parseInt(ctx.canvas.height / dim[1], 10);
	for (let i = 0; i <= rowCount; i++) {
		gfxCanvas.rect(ctx, {x: 0, y: i * dim[1], width: dim[0], height: dim[1]},
			pattern[(pos[1] - i) % 12] ? '#1e1e1e' : '#ccc', '#555');
		gfxCanvas.line(ctx, {x: dim[0], y: (i + 1) * dim[1]},
			{x: ctx.canvas.width, y: (i + 1) * dim[1]}, '#555');
		if ((pos[1] - i) % 12 === 0) gfxCanvas.text(ctx, {
			x: 2,
			y: (i + 1) * dim[1] - 2,
			fillText: (({key, octave}) => `${key}${octave}`)(numberToNote(pos[1] - i)),
			fill: pattern[(pos[1] - i) % 12] ? '#ccc' : '#1e1e1e'
		});
	}
	for (let i = 0; i < colCount; i++) {
		gfxCanvas.line(ctx, {x: i * dim[0], y: 0}, {x: i * dim[0], y: ctx.canvas.height}, '#555');
	}
};

const drawEvents = (ctx, events, dim = [42, 14], bar, pos = [0, 60]) => {
	console.log('drawing events');
	prepCanvas(ctx);
	const colCount = parseInt(ctx.canvas.width / dim[0], 10) + 1;
	const rowCount = parseInt(ctx.canvas.height / dim[1], 10);
	events
		.filter(event => noteToNumber(event.note) <= pos[1] && noteToNumber(event.note) > (pos[1] - rowCount))
		.forEach(event => {
			const yPos = pos[1] - noteToNumber(event.note);
			gfxCanvas.rect(ctx, {
				x: (event.start - bar.start + 1) * dim[0], y: yPos * dim[1],
				width: event.duration * dim[0], height: dim[1]
			}, '#eee', '#555');
		});
};

// state.session.selection.
const prepPressed = (channels, track) => track.input.device > -1
	? channels[track.input.device] && channels[track.input.device][track.input.channel] || {}
	: Object.keys(channels)
		.reduce((cn, d) =>
			Object.keys(channels[d][track.input.channel] || {})
				.reduce((cn, note) =>
					obj.patch(cn, note, channels[d][track.input.channel][note] || cn[note]),
					cn
				),
			{}
		);

let unhook = {};

const hook = ({state$, actions}) => {
	let subs = [];

	const pianoRollEl$ = interval(500 /* ms */).pipe(
		map(() => document.querySelector('.piano-roll')),
		distinctUntilChanged((prev, curr) => prev === curr),
		filter(el => el),
		map(el => ({
			grid: el.querySelector('.piano-roll .grid'),
			events: el.querySelector('.piano-roll .events')
		}))
	);

	// grid changes
	subs.push(
		combineLatest([
			state$.pipe(
				distinctUntilChanged((prev, curr) => {
					const prevPos = prev.pianoRoll.position;
					const currPos = curr.pianoRoll.position;
					return JSON.stringify(prevPos) === JSON.stringify(currPos);
				})
			),
			pianoRollEl$
		]).pipe(
			map(([state, el]) => ({state, el}))
		).subscribe(({el, state}) => {
			const gridCtx = el.grid.getContext('2d');
			const dim = [30, 12];
			drawGrid(gridCtx, dim, state.pianoRoll.position);
		})
	);

	// event changes
	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => {
				const prevKey = JSON.stringify(prev.pianoRoll.position) +
					JSON.stringify(prev.studio.tick.tracks[prev.session.selection.piano[0]].bar) +
					JSON.stringify(prev.pianoRoll.events);
				const currKey = JSON.stringify(curr.pianoRoll.position) +
					JSON.stringify(curr.studio.tick.tracks[curr.session.selection.piano[0]].bar) +
					JSON.stringify(curr.pianoRoll.events);
				return prevKey === currKey;
			}),
			withLatestFrom(pianoRollEl$),
			map(([state, el]) => ({state, el}))
		).subscribe(({el, state}) => {
				const eventsCtx = el.events.getContext('2d');
				const dim = [30, 12];
				// ctx.translate(0.5, 0.5);
				const bar = {
					start: state.studio.beatLength *
						((state.studio.tick.tracks[state.session.selection.piano[0]]
						&& state.studio.tick.tracks[state.session.selection.piano[0]].bar) || 0),
					end: state.studio.beatLength *
						(state.studio.tick.tracks[state.session.selection.piano[0]]
						&& (state.studio.tick.tracks[state.session.selection.piano[0]].bar + 1) || 1)
				};

				// console.log(bar);

				const events = state.pianoRoll.events
					.filter(event => event.start >= bar.start && event.start < bar.end);

				// console.log(events);
				drawEvents(eventsCtx, events, dim, bar, state.pianoRoll.position);
			})
		);

	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => {
				return JSON.stringify(prev.midiMap.channels) === JSON.stringify(curr.midiMap.channels);
			}),
			filter(state => state.studio.recording),
			map(state => ({
				state,
				pressed: prepPressed(
					state.midiMap.channels,
					state.session.tracks[state.session.selection.piano[0]]
				)
			}))
		)
			// .map(({state, channels}) => ({
			// 	state,
			// 	pressed: Object.keys(channels).filter(ch => parseInt(ch, 10) !== 10).reduce(
			// 		(pressed, ch) => Object.assign({}, pressed, channels[ch]),
			// 		{}
			// 	)
			// }))
			// .map(({state, pressed}) => (console.log(pressed), ({state, pressed})))
			.subscribe(({state, pressed}) => actions.pianoRoll.record(pressed, state.studio.tick, audio.context.currentTime))
	);

	subs.push(
		state$.pipe(
			distinctUntilChanged((prev, curr) => {
				const prevTick = prev.studio.tick;
				const currTick = curr.studio.tick;
				return prevTick.index === currTick.index && prevTick.elapsed === currTick.elapsed;
			}),
			filter(state => state.studio.tick.index === 0)
		).subscribe(state => actions.pianoRoll.clean())
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
