'use strict';

const {obj, fn} = require('iblokz-data');
const {filter, distinctUntilChanged, map, share, withLatestFrom, throttleTime, bufferCount} = require('rxjs/operators');

const midi = require('../util/midi');
const pocket = require('../util/pocket');

// util
const indexAt = (a, k, v) => a.reduce((index, e, i) => ((obj.sub(e, k) === v) ? i : index), -1);
const prepVal = (min = 0, max = 1, digits = 3) => val =>
	[(min + val * max - val * min).toFixed(digits)]
		.map(val =>
			(digits === 0) ? parseInt(val, 10) : parseFloat(val)
		)
		.pop();

let unhook = () => {};

const clockMsg = [248];    // note on, middle C, full velocity

const hook = ({state$, actions, tapTempo}) => {
	let subs = [];

	const tick$ = pocket.stream.pipe(
		filter(p => p.clockTick),
		distinctUntilChanged((prev, curr) => {
			const prevTick = prev.clockTick;
			const currTick = curr.clockTick;
			return prevTick && currTick && prevTick.time === currTick.time && prevTick.i === currTick.i;
		}),
		map(p => p.clockTick)
	);

	const {devices$, msg$} = midi.init();

	// midi device access
	subs.push(
		devices$.subscribe(data => actions.midiMap.connect(data))
	);

	const parsedMidiMsg$ = msg$.pipe(
		map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw})),
		// map(data => (console.log(data), data))
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

	// midi messages
	subs.push(
		parsedMidiMsg$.pipe(
			// map(midiData => (console.log({midiData}), midiData))
			filter(({msg}) => ['noteOn', 'noteOff'].indexOf(msg.state) > -1),
			withLatestFrom(state$),
			map(([midiData, state]) => (Object.assign({}, midiData, {state}))),
			filter(({raw, state}) => (
				// console.log(raw.input.id, state.midiMap.devices.inputs, state.midiMap.data.in),
				getIds(state.midiMap.devices.inputs, state.midiMap.data.in).indexOf(
					raw.input.id
				) > -1
			))
		).subscribe(({raw, msg, state}) => {
				// console.log(state.midiMap.devices.inputs, raw.input);
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
					&& state.studio.playing && state.studio.recording && state.studio.tick.index > -1) {
					setTimeout(
						() => actions.sequencer.update(
							state.sequencer.bar, msg.note.number - 60, state.studio.tick.index + 1, msg.velocity),
						100
					);
				}
			})
	);

	const {throttleTime} = require('rxjs/operators');
	subs.push(
		parsedMidiMsg$.pipe(
			// map(midiData => (console.log({midiData}), midiData))
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

	// controller
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
				// console.log(mmap);
				if (mmap) {
					let [msgType, msgVal, propPath, ...valMods] = mmap;
					// vca
					if (propPath[0] === 'instrument' && propPath[1] === 'eg')
						propPath = ['instrument', `vca${state.instrument.vcaOn + 1}`, propPath[2]];
					// value
					let val = prepVal(...valMods)(data.msg.value);
					// console.log(propPath, val);
					actions.change(propPath[0], propPath.slice(1), val);
				}
			})
		);

	// on access sync clocks
	subs.push(
		tick$.pipe(
			// filter(({time, i}) => i % 2 === 0)
			withLatestFrom(state$),
			map(([time, state]) => ({time, state})),
			filter(({state}) => state.midiMap.clock.out.length > 0
				&& state.midiMap.clock.out.filter(out =>
					state.midiMap.devices.outputs[out]
				).length > 0
			)
		).subscribe(({time, state}) => {
				// console.log(state.midiMap.clock.out, clockMsg);
				state.midiMap.clock.out.forEach(out =>
					state.midiMap.devices.outputs[out].send(clockMsg)
				);
				// output.send(clockMsg);
			})
	);

	// midi to clock
	subs.push(
		midiState$.pipe(
			filter(({data}) => data.msg.binary === '11111000'),
			filter(({data, state}) =>
				state.midiMap.clock.in === indexAt(state.midiMap.devices.inputs, 'name', data.raw.input.name)
			),
			bufferCount(24, 1)
		).subscribe(() => tapTempo.tap())
	);

/*
	// studio controls
	subs.push(
		midiState$
			.filter(({data}) =>
				data.msg.state === 'controller'
				&& [41, 42, 45].indexOf(data.msg.controller) > -1
				&& data.msg.value === 1
			)
			.subscribe(({data}) => {
				switch (data.msg.controller) {
					case 41:
						actions.studio.play();
						break;
					case 42:
						actions.studio.stop();
						break;
					case 45:
						actions.studio.record();
						break;
					default:

				}
			})
		);
*/
	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
