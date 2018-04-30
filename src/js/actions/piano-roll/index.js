'use strict';

const {obj, fn} = require('iblokz-data');

const {measureToBeatLength, bpmToTime} = require('../../util/math');

const initial = {
	barsLength: 1,
	bar: 0,
	events: [
		/*
		{
			note: 'C2',
			// tick index
			start: 0,
			// in relation to ticks / tick = 1/16
			duration: 1
		},
		{
			note: 'G2',
			// tick index
			start: 4,
			// in relation to ticks / tick = 1/16
			duration: 2
		},
		{
			note: 'C2',
			// tick index
			start: 7,
			// in relation to ticks / tick = 1/16
			duration: 1
		},
		{
			note: 'C2',
			// tick index
			start: 10,
			// in relation to ticks / tick = 1/16
			duration: 1
		},
		{
			note: 'G2',
			// tick index
			start: 12,
			// in relation to ticks / tick = 1/16
			duration: 2
		},
		{
			note: 'F#2',
			// tick index
			start: 14,
			// in relation to ticks / tick = 1/16
			duration: 1
		}
		*/
	]
};

const prepTime = (start, end, div, quantize = 0.25) =>
	Math.round((end - start) / div / quantize) * quantize;

const clear = () => state => obj.patch(state, ['pianoRoll', 'events'], []);

const record = (pressed, tick, currentTime) => state =>
	fn.pipe(
		() => console.log(pressed, tick, currentTime),
		() => ({
			timeOffset: prepTime(tick.time, currentTime, bpmToTime(state.studio.bpm)),
			barStart: tick.tracks[state.session.selection.piano[0]]
				&& (tick.tracks[state.session.selection.piano[0]].bar * state.studio.beatLength) || 0,
			beatIndex: tick.tracks[state.session.selection.piano[0]]
				&& tick.tracks[state.session.selection.piano[0]].index || 0,
			bar: tick.tracks[state.session.selection.piano[0]]
				&& (tick.tracks[state.session.selection.piano[0]].bar) || 0,
			barsLength: state.pianoRoll.barsLength
		}),
		data => (console.log(data), data),
		({timeOffset, barStart, beatIndex, barsLength, bar}) => obj.patch(state, 'pianoRoll', {
			events: [].concat(
				// already recorded events
				state.pianoRoll.events.filter(ev => ev.duration > 0),
				// still pressed
				state.pianoRoll.events.filter(ev => ev.duration === 0
						&& ev.startTime <= currentTime
						// && ev.start <= (barStart + beatIndex + timeOffset)
						&& pressed[ev.note]),
				// unpressed
				state.pianoRoll.events.filter(ev => ev.duration === 0
					&& ev.startTime <= currentTime
					&& !pressed[ev.note]
					// || (tick.index < ev.start && ev.start >= state.studio.beatLength - 1)))
				).map(ev => Object.assign(ev, {
					duration: prepTime(ev.startTime, currentTime, bpmToTime(state.studio.bpm))
				})),
				// new
				Object.keys(pressed)
					.filter(key => state.pianoRoll.events
						.filter(ev => ev.note === key
								&& ev.startTime <= currentTime
								// && (ev.start <= barStart + beatIndex + timeOffset)
								&& ev.duration === 0)
						.length === 0
					)
					.map(note => ({note,
						start: (beatIndex === state.studio.beatLength - 1 && timeOffset > 0.95)
							? bar < barsLength - 1 ? barStart + state.studio.beatLength : 0
							: barStart + beatIndex + timeOffset,
						velocity: pressed[note],
						duration: 0,
						startTime: currentTime
					}))
			)
		})
	)();

const clean = () => state => obj.patch(state, 'pianoRoll', {
	// events: state.pianoRoll.events.filter(ev => ev.duration > 0 || ev.start === 0)
	events: state.pianoRoll.events // .filter(ev => ev.duration > 0 || ev.start === 0)
});

module.exports = {
	initial,
	clear,
	record,
	clean
};
