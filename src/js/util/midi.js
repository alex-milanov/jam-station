'use strict';

const Rx = require('rx');
const $ = Rx.Observable;

const numberToNote = number => {
	var notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	var octave = parseInt(number / 12, 10);
	var step = number - octave * 12;
	var pitch = notes[step];
	return {
		pitch: `${pitch}${octave}`,
		midi: number
	};
};

const MIDIMessageEventHandler = event => {
	// Mask off the lower nibble (MIDI channel, which we don't care about)

	if (event.data[1]) {
		var number = event.data[1];
		var note = numberToNote(number);

		switch (event.data[0] & 0xf0) {
			case 0x90:
				if (event.data[2] !== 0) {	// if velocity != 0, this is a note-on message
					// scope.onKeyDown(note);
				}
				break;
				// if velocity == 0, fall thru: it's a note-off.	MIDI's weird, ya'll.
			case 0x80:
				// scope.onKeyUp(note);
				break;
			default:
				break;
		}
		return;
	}
};

const hookUpMIDIInput = midiAccess => {
	var haveAtLeastOneDevice = false;
	var inputs = midiAccess.inputs.values();
	for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
		input.value.onmidimessage = MIDIMessageEventHandler;
		haveAtLeastOneDevice = true;
	}
};

const onMIDIInit = midi => {
	hookUpMIDIInput(midi);
	midi.onstatechange = hookUpMIDIInput;
};

const onMIDIReject = err =>
	console.log(err, 'The MIDI system failed to start.');

//(navigator.requestMIDIAccess)
//		&& navigator.requestMIDIAccess().then(onMIDIInit, onMIDIReject);

const init = () => {
	const midiAccess$ = $.fromPromise(navigator.requestMIDIAccess());
	
}

module.exports = {
	init
};
