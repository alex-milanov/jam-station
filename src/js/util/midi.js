'use strict';

const Rx = require('rx');
const $ = Rx.Observable;

const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const numberToNote = number => ({
	key: keys[number % 12],
	octave: parseInt((number - number % 12) / 12, 10) - 1,
	number
});

const noteToNumber = note => (
	keys.indexOf(note.replace(/[0-9]+/, '')) +
	(parseInt(note.replace(/[A-Z#b]+/, ''), 10) + 1) * 12
);

const parseMidiMsg = event => {
	// Mask off the lower nibble (MIDI channel, which we don't care about)

	const status = event.data[0] & 0xf0;
	const binary = event.data[0].toString(2);
	const channel = event.data[0] - status + 1;
	let msg = {};

	switch (binary.slice(0, 4)) {
		// noteoff
		case "1000":
			msg = {
				state: 'noteOff',
				note: numberToNote(event.data[1])
			};
			break;
		// noteon
		case "1001":
			msg = (event.data[2] !== 0) // if velocity != 0, this is a note-on message
				? {
					state: 'noteOn',
					note: numberToNote(event.data[1]),
					velocity: parseFloat((event.data[2] / 127).toFixed(2))
				}
				: { // if velocity == 0, fall thru: it's a note-off.	MIDI's weird, ya'll.
					state: 'noteOff',
					note: numberToNote(event.data[1])
				};
			break;
		// pitch wheel
		case "1110":
			msg = {
				state: 'pitchBend',
				pitchValue: (event.data[2] === 64) ? 0 : parseFloat((event.data[2] / 63.5 - 1).toFixed(2))
			};
			break;
		// controller
		case "1011":
			msg = {
				state: "controller",
				controller: event.data[1],
				value: parseFloat((event.data[2] / 127).toFixed(2))
			};
			break;
		case "1100":
			msg = {
				state: "bankSelect",
				bank: event.data[1]
			};
			break;
		default:
			msg = {
				state: false
			};
			break;
	}

	return Object.assign({}, msg, {
		binary,
		status,
		channel,
		data: event.data
	});
};
//
// const hookUpMIDIInput = midiAccess => {
// 	var haveAtLeastOneDevice = false;
// 	var inputs = midiAccess.inputs.values();
// 	for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
// 		input.value.onmidimessage = MIDIMessageEventHandler;
// 		haveAtLeastOneDevice = true;
// 	}
// };
//
// const onMIDIInit = midi => {
// 	hookUpMIDIInput(midi);
// 	midi.onstatechange = hookUpMIDIInput;
// };
//
// const onMIDIReject = err =>
// 	console.log(err, 'The MIDI system failed to start.');
//
// (navigator.requestMIDIAccess)
// 		&& navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);

const parseAccess = access => {
	let inputs = [];
	let outputs = [];

	// console.log(access);

	access.inputs.forEach(input => inputs.push(input));
	access.outputs.forEach(output => outputs.push(output));
	return {access, inputs, outputs};
};

const init = () => {
	const devices$ = new Rx.Subject();
	$.fromPromise(navigator.requestMIDIAccess())
		.flatMap(access => $.create(stream => {
			access.onstatechange = connection => stream.onNext(connection.currentTarget);
		}).startWith(access))
		.map(parseAccess)
		// .map(data => (console.log('midi access', data), data))
		.subscribe(device => devices$.onNext(device));
		// .share();

	const msg$ = new Rx.Subject();
	devices$.flatMap(
		({access, inputs}) => inputs.reduce(
				(msgStream, input) => msgStream.merge(
					$.fromEventPattern(h => {
						input.onmidimessage = h;
					})
					.map(msg => ({access, input, msg}))
				), $.empty()
			)
	).subscribe(msg => msg$.onNext(msg));

	return {
		devices$,
		msg$
	};
};

module.exports = {
	init,
	numberToNote,
	noteToNumber,
	parseMidiMsg
};
