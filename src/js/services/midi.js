'use strict';

const {obj} = require('iblokz-data');

const midi = require('../util/midi');

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

	const {access$, msg$} = midi.init();

	// midi device access
	subs.push(
		access$.subscribe(data => actions.midiMap.connect(data))
	);

	const parsedMidiMsg$ = msg$
		.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
		.share();

	const midiState$ = parsedMidiMsg$
		.withLatestFrom(state$, (data, state) => ({data, state}))
		.share();

	// midi messages
	subs.push(
		parsedMidiMsg$
			// .map(midiData => (console.log({midiData}), midiData))
			.filter(({msg}) => ['noteOn', 'noteOff'].indexOf(msg.state) > -1)
			.subscribe(({msg}) => actions.midiMap.noteOn(
				msg.channel,
				msg.note.key + msg.note.octave,
				msg.velocity || 0
			))
	);

	subs.push(
		parsedMidiMsg$
			// .map(midiData => (console.log({midiData}), midiData))
			.filter(({msg}) => ['pitchBend'].indexOf(msg.state) > -1)
			.throttle(1)
			.subscribe(({msg}) => actions.set(['midiMap', 'pitch'], msg.pitchValue))
	);

	subs.push(
		midiState$
			.filter(({data}) => data.msg.state === 'controller')
			.distinctUntilChanged(({data}) => data.msg.value)
			.throttle(10)
			.subscribe(({data, state}) => {
				let mmap = state.midiMap.map.find(m =>
					m[0] === data.msg.state
					&& m[1] === data.msg.controller
				);
				// console.log(mmap);
				if (mmap) {
					let [msgType, msgVal, propPath, ...valMods] = mmap;
					// vca
					if (propPath[0] === 'instrument' && propPath[1] === 'eg')
						propPath = ['instrument', `vca${state.instrument.vcaOn + 1}`, propPath[1]];
					// value
					let val = prepVal.apply(null, valMods)(data.msg.value);
					actions.change(propPath[0], propPath.slice(1), val);
				}
			})
		);

	/*
	// on access sync clocks
	subs.push(
		access$
			.flatMap(access => tick$
				.filter(({time, i}) => i % 2 === 0)
				.withLatestFrom(state$, (time, state, access) => ({time, state, access}))
				.filter(({state, access}) => state.midiMap.clock.out !== false && access.outputs[state.midiMap.clock.out])
			)
			.subscribe(({time, state, access}) => {
				console.log(state.midiMap.clock.out, clockMsg);
				access.outputs[state.midiMap.clock.out].send(clockMsg);
				// output.send(clockMsg);
			})
	);

	// midi to clock
	subs.push(
		midiState$
			.filter(({data}) => data.msg.binary === '11111000')
			.filter(({data, state}) =>
				state.midiMap.clock.in === indexAt(state.midiMap.devices.inputs, 'name', data.raw.input.name)
			)
			.bufferWithCount(1, 24)
			.subscribe(() => tapTempo.tap())
	);

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
