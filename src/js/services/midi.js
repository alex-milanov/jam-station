'use strict';

const {obj, fn} = require('iblokz-data');
const {filter, distinctUntilChanged, map, share, withLatestFrom, throttleTime, bufferCount} = require('rxjs/operators');

const midi = require('../util/midi');
const time = require('../util/time');
const {derivePosition, stepIndex, MODIFIER} = require('../util/position');
const {calculateProgress} = require('../util/math');
const a = require('iblokz-audio');

const indexAt = (a, k, v) => a.reduce((index, e, i) => ((obj.sub(e, k) === v) ? i : index), -1);
const prepVal = (min = 0, max = 1, digits = 3) => val =>
	[(min + val * max - val * min).toFixed(digits)]
		.map(val =>
			(digits === 0) ? parseInt(val, 10) : parseFloat(val)
		)
		.pop();

let unhook = () => {};

const clockMsg = [248];

const hook = ({state$, actions, tapTempo}) => {
	let subs = [];

	const {devices$, msg$} = midi.init();

	subs.push(
		devices$.subscribe(data => actions.midiMap.connect(data))
	);

	const parsedMidiMsg$ = msg$.pipe(
		map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw})),
		share()
	);

	const getIds = (inputs, indexes) => inputs
		.map(inp => inp.id)
		.filter((id, i) => indexes.indexOf(i) > -1);

	const midiState$ = parsedMidiMsg$.pipe(
		withLatestFrom(state$),
		map(([data, state]) => ({data, state})),
		filter(({data, state}) => getIds(state.midiMap.devices.inputs, state.midiMap.data.in).indexOf(
			data.raw.input.id
		) > -1),
		share()
	);

	subs.push(
		parsedMidiMsg$.pipe(
			filter(({msg}) => ['noteOn', 'noteOff'].indexOf(msg.state) > -1),
			withLatestFrom(state$),
			map(([midiData, state]) => (Object.assign({}, midiData, {state}))),
			filter(({raw, state}) => (
				getIds(state.midiMap.devices.inputs, state.midiMap.data.in).indexOf(
					raw.input.id
				) > -1
			))
		).subscribe(({raw, msg, state}) => {
				const deviceIndex = state.midiMap.devices.inputs.indexOf(raw.input);

				actions.midiMap.noteOn(
					deviceIndex,
					msg.channel,
					msg.note.key + msg.note.octave,
					msg.velocity || 0
				);

				if (msg.state === 'noteOn' && (
					[-1, deviceIndex].indexOf(state.session.tracks[0].input.device) > -1
					&& msg.channel === state.session.tracks[0].input.channel
				)
					&& state.studio.playing && state.studio.recording && state.studio.startTime != null) {
					const {startTime, cycleOffset, bpm, beatLength} = state.studio;
					const progress = calculateProgress(
						startTime, a.context.currentTime, cycleOffset, bpm, beatLength, MODIFIER
					);
					const step = stepIndex(progress, beatLength);
					const bar = derivePosition(
						state.studio, state.sequencer, state.session
					).bar;
					actions.sequencer.update(bar, msg.note.number - 60, step, msg.velocity);
				}
			})
	);

	subs.push(
		parsedMidiMsg$.pipe(
			filter(({msg}) => ['pitchBend'].indexOf(msg.state) > -1),
			throttleTime(1)
		).subscribe(({msg}) => actions.set(['midiMap', 'pitch'], msg.pitchValue))
	);

	subs.push(
		parsedMidiMsg$.pipe(
			filter(({msg}) => msg.state === 'bankSelect'),
			filter(({msg}) => msg.bank >= 0 && msg.bank < 16)
		).subscribe(({msg}) =>
				fn.pipe(
					() => ({
						track: msg.bank % 4,
						row: parseInt(
							(msg.bank >= 4 && msg.bank < 8
							|| msg.bank >= 12 && msg.bank < 16
								? msg.bank - 4
								: msg.bank + 4) / 4,
							10
						)
					}),
					({track, row}) => (
						actions.session.activate(track, row),
						actions.session.select(track, row)
					)
				)()
			)
	);

	subs.push(
		midiState$.pipe(
			filter(({data}) => data.msg.state === 'controller'),
			distinctUntilChanged((prev, curr) => prev.data.msg.value === curr.data.msg.value),
			throttleTime(10)
		).subscribe(({data, state}) => {
				let mmap = state.midiMap.map.find(m =>
					m[0] === data.msg.state
					&& m[1] === data.msg.controller
				);
				if (mmap) {
					let [msgType, msgVal, propPath, ...valMods] = mmap;
					if (propPath[0] === 'instrument' && propPath[1] === 'eg')
						propPath = ['instrument', `vca${state.instrument.vcaOn + 1}`, propPath[2]];
					let val = prepVal(...valMods)(data.msg.value);
					actions.change(propPath[0], propPath.slice(1), val);
				}
			})
		);

	// MIDI clock out — 6 pulses per 16th note (24 per quarter)
	subs.push(
		time.frame().pipe(
			withLatestFrom(state$),
			filter(([, state]) => state.studio.playing && state.studio.startTime != null),
			filter(([, state]) => state.midiMap.clock.out.length > 0
				&& state.midiMap.clock.out.filter(out =>
					state.midiMap.devices.outputs[out]
				).length > 0
			),
			map(([, state]) => {
				const {startTime, cycleOffset, bpm, beatLength} = state.studio;
				const progress = calculateProgress(
					startTime, a.context.currentTime, cycleOffset, bpm, beatLength, MODIFIER
				);
				return {
					pulse: Math.floor(progress * beatLength * 6),
					state
				};
			}),
			distinctUntilChanged((prev, curr) => prev.pulse === curr.pulse)
		).subscribe(({state}) => {
			state.midiMap.clock.out.forEach(out =>
				state.midiMap.devices.outputs[out].send(clockMsg)
			);
		})
	);

	subs.push(
		midiState$.pipe(
			filter(({data}) => data.msg.binary === '11111000'),
			filter(({data, state}) =>
				state.midiMap.clock.in === indexAt(state.midiMap.devices.inputs, 'name', data.raw.input.name)
			),
			bufferCount(24, 1)
		).subscribe(() => tapTempo.tap())
	);

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
