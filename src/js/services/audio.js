'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const obj = require('iblokz/common/obj');
const a = require('../util/audio');

// util

let changes$ = new Subject();

const initial = {
	// an dictionary midikey : vco
	/*
	voice: {
		vco1
		vco2
		vca1
		vca2
	}
	*/
	voices: {}, // a.start(a.vco({type: 'square'})),
	// vca1: a.vca({gain: 0}),
	vcf: a.vcf({}),
	// lfo: a.lfo({}),
	volume: a.vca({gain: 0.7}),
	context: a.context
};

const updatePrefs = instr => changes$.onNext(nodes =>
	obj.map(nodes,
		(node, key) => (instr[key])
			? a.apply(node, instr[key])
			: (key === 'voices')
				? obj.map(node, voice => obj.map(voice, (n, key) => a.apply(n, instr[key])))
				: node));

const updateConnections = instr => changes$.onNext(nodes => {
	//
	let {voices, vcf, volume, context} = nodes;

	// vco to vca, vca to vcf / volume
	voices = obj.map(voices, voice => ({
		vco1: a.connect(voice.vco1, voice.vca1),
		vco2: a.connect(voice.vco2, voice.vca2),
		vca1: (!instr.vco1.on) ? a.disconnect(voice.vca1) : a.reroute(voice.vca1, (instr.vcf.on) ? vcf : volume),
		vca2: (!instr.vco2.on) ? a.disconnect(voice.vca2) : a.reroute(voice.vca2, (instr.vcf.on) ? vcf : volume)
	}));

	console.log(nodes.voices, voices);

	// vcf
	if (instr.vcf.on) {
		vcf = a.connect(vcf, volume);
	} else {
		vcf = a.disconnect(vcf, volume);
	}

	volume = a.connect(volume, context.destination);

	return Object.assign({}, nodes, {voices, vcf, volume, context});
});

const noteOn = (instr, note, velocity) => changes$.onNext(nodes => {
	let {voices, vcf, volume, context} = nodes;

	const now = context.currentTime;
	const time = now + 0.0001;

	const freq = a.noteToFrequency(note.key + note.octave);

	console.log(instr, note, velocity);

	let voice = voices[note.number] || false;

	if (voice.vco1) a.stop(voice.vco1);
	let vco1 = a.start(a.vco(Object.assign({}, instr.vco1, {freq})));
	let vca1 = voice ? voice.vca1 : a.vca({});
	vco1 = a.connect(vco1, vca1);
	vca1 = !(instr.vco1.on) ? a.disconnect(vca1) : a.reroute(vca1, (instr.vcf.on) ? vcf : volume);

	if (voice.vco2) a.stop(voice.vco2);
	let vco2 = a.start(a.vco(Object.assign({}, instr.vco2, {freq})));
	let vca2 = voice ? voice.vca2 : a.vca({});
	vco2 = a.connect(vco2, vca2);
	vca2 = !(instr.vco2.on) ? a.disconnect(vca2) : a.reroute(vca2, (instr.vcf.on) ? vcf : volume);

	// vcf
	vcf = (instr.vcf.on) ? a.connect(vcf, volume) : a.disconnect(vcf);

	vca1.node.gain.cancelScheduledValues(0);
	vca2.node.gain.cancelScheduledValues(0);

	// attack
	if (instr.vca1.attack > 0)
		vca1.node.gain.setValueCurveAtTime(new Float32Array([0, velocity * instr.vca1.volume]), time, instr.vca1.attack);
	else
		vca1.node.gain.setValueAtTime(velocity, now);

	if (instr.vca2.attack > 0)
		vca2.node.gain.setValueCurveAtTime(new Float32Array([0, velocity * instr.vca2.volume]), time, instr.vca2.attack);
	else
		vca2.node.gain.setValueAtTime(velocity, now);

	// decay
	if (instr.vca1.decay > 0)
		vca1.node.gain.setValueCurveAtTime(
			new Float32Array([velocity * instr.vca1.volume, instr.vca1.sustain * velocity * instr.vca1.volume]),
			time + instr.vca1.attack, instr.vca1.decay);
	if (instr.vca2.decay > 0)
		vca2.node.gain.setValueCurveAtTime(
			new Float32Array([velocity * instr.vca2.volume, instr.vca2.sustain * velocity * instr.vca2.volume]),
			time + instr.vca2.attack, instr.vca2.decay);

	return Object.assign({}, nodes, {
		voices: obj.patch(voices, note.number, {
			vco1,
			vco2,
			vca1,
			vca2
		}),
		vcf,
		context});
});

const noteOff = (instr, note) => changes$.onNext(nodes => {
	const {voices, context} = nodes;
	const now = context.currentTime;
	const time = now + 0.0001;

	let voice = voices[note.number] || false;
	if (voice) {
		let {vco1, vca1, vco2, vca2} = voice;

		vca1.node.gain.cancelScheduledValues(0);
		vca2.node.gain.cancelScheduledValues(0);
		vca1.node.gain.setValueCurveAtTime(new Float32Array([vca1.node.gain.value, 0]),
			time, instr.vca1.release > 0 && instr.vca1.release || 0.00001);
		vca2.node.gain.setValueCurveAtTime(new Float32Array([vca2.node.gain.value, 0]),
			time, instr.vca2.release > 0 && instr.vca2.release || 0.00001);

		a.stop(vco1, time + (instr.vca1.release > 0 && instr.vca1.release || 0.00001));
		a.stop(vco2, time + (instr.vca2.release > 0 && instr.vca2.release || 0.00001));

		return Object.assign({}, nodes, {voices: obj.patch(voices, note.number, {
			vco1, vco2, vca1, vca2
		}), context});
	}

	return nodes;
});

const pitchBend = (instr, pitchValue) => changes$.onNext(nodes =>
	obj.patch(nodes, 'voices', obj.map(nodes.voices, voice => Object.assign({}, voice, {
		vco1: a.apply(voice.vco1, {detune: instr.vco1.detune + pitchValue * 200}),
		vco2: a.apply(voice.vco2, {detune: instr.vco2.detune + pitchValue * 200})
	})))
);

const engine$ = changes$
	.startWith(() => initial)
	.scan((state, change) => change(state), {})
	.subscribe(state => console.log(state));

const hook = ({state$, midi, actions}) => {
	// hook state changes
	const instrUpdates$ = state$.distinctUntilChanged(state => state.instrument).map(state => state.instrument);
	// update connections
	instrUpdates$.distinctUntilChanged(instr => instr.vco1.on + instr.vco2.on + instr.vcf.on + instr.lfo.on)
		.subscribe(updateConnections);
	// update prefs
	instrUpdates$
		.subscribe(updatePrefs);

	// hook midi signals
	midi.access$.subscribe(data => actions.midiMap.connect(data));
	midi.state$.subscribe(data => console.log('state', data));
	midi.msg$
		.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
		.filter(data => data.msg.binary !== '11111000') // ignore midi clock for now
		.map(data => (console.log(`midi: ${data.msg.binary}`, data.msg), data))
		.withLatestFrom(state$, (data, state) => ({data, state}))
		.subscribe(({data, state}) => {
			switch (data.msg.state) {
				case 'noteOn':
					noteOn(state.instrument, data.msg.note, data.msg.velocity);
					break;
				case 'noteOff':
					noteOff(state.instrument, data.msg.note);
					break;
				case 'pitchBend':
					pitchBend(state.instrument, data.msg.pitchValue);
					break;
				default:
					break;
			}
		});
};

module.exports = {
	hook
};
