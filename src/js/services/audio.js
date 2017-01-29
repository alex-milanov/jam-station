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

const updateConnections = instr => changes$.onNext(nodes => Object.assign({}, nodes, {
	voices: obj.map(nodes.voices, voice => ({
		vco1: a.connect(voice.vco1, voice.vca1),
		vco2: a.connect(voice.vco2, voice.vca2),
		vca1: (!instr.vco1.on)
			? a.disconnect(voice.vca1)
			: a.reroute(voice.vca1, (instr.vcf.on) ? nodes.vcf : nodes.volume),
		vca2: (!instr.vco2.on)
			? a.disconnect(voice.vca2)
			: a.reroute(voice.vca2, (instr.vcf.on) ? nodes.vcf : nodes.volume)
	})),
	vcf: (instr.vcf.on) ? a.connect(nodes.vcf, nodes.volume) : a.disconnect(nodes.vcf, nodes.volume),
	volume: a.connect(nodes.volume, nodes.context.destination)
}));

const noteOn = (instr, note, velocity) => changes$.onNext(nodes => {
	let {voices, vcf, volume, context} = nodes;

	const now = context.currentTime;
	const time = now + 0.0001;

	const freq = a.noteToFrequency(note.key + note.octave);

	// console.log(instr, note, velocity);

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

	const vca1Changes = [].concat(
		// attack
		(instr.vca1.attack > 0)
			? [[0, time], [velocity * instr.vca1.volume, instr.vca1.attack]] : [[velocity * instr.vca1.volume, now]],
		// decay
		(instr.vca1.decay > 0)
			? [[instr.vca1.sustain * velocity * instr.vca1.volume, instr.vca1.decay]] : []
	).reduce((a, c) => [[].concat(a[0], c[0]), [].concat(a[1], c[1])], [[], []]);

	a.scheduleChanges(vca1, 'gain', vca1Changes[0], vca1Changes[1]);

	const vca2Changes = [].concat(
		// attack
		(instr.vca2.attack > 0)
			? [[0, time], [velocity * instr.vca2.volume, instr.vca2.attack]] : [[velocity * instr.vca2.volume, now]],
		// decay
		(instr.vca2.decay > 0)
			? [[instr.vca2.sustain * velocity * instr.vca2.volume, instr.vca2.decay]] : []
	).reduce((a, c) => [[].concat(a[0], c[0]), [].concat(a[1], c[1])], [[], []]);

	a.scheduleChanges(vca2, 'gain', vca2Changes[0], vca2Changes[1]);

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

	let midiMap = {
		20: ['instrument', 'vcf', 'cutoff'],
		21: ['instrument', 'vcf', 'resonance'],
		22: ['studio', 'bpm', 60, 200, 0],
		23: ['studio', 'volume'],
		24: ['instrument', 'eg', 'attack'],
		25: ['instrument', 'eg', 'decay'],
		26: ['instrument', 'eg', 'sustain'],
		27: ['instrument', 'eg', 'release']
	};

	// hook midi signals
	midi.access$.subscribe(data => actions.midiMap.connect(data));
	midi.msg$
		.map(raw => ({msg: midi.parseMidiMsg(raw.msg), raw}))
		.filter(data => data.msg.binary !== '11111000') // ignore midi clock for now
		.map(data => (console.log(`midi: ${data.msg.binary}`, data.msg), data))
		.withLatestFrom(state$, (data, state) => ({data, state}))
		.subscribe(({data, state}) => {
			switch (data.msg.state) {
				case 'noteOn':
					if (data.msg.note.channel !== 10) noteOn(state.instrument, data.msg.note, data.msg.velocity);
					break;
				case 'noteOff':
					if (data.msg.note.channel !== 10) noteOff(state.instrument, data.msg.note);
					break;
				case 'pitchBend':
					pitchBend(state.instrument, data.msg.pitchValue);
					break;
				case 'controller':
					let mmap = midiMap[data.msg.controller];
					if (mmap && mmap[0] === 'instrument') {
						let value = parseFloat(
							(mmap[4] || 0) + data.msg.value * (mmap[4] || 1) - data.msg.value * (mmap[3] || 0)
						).toFixed(mmap[5] || 3);
						value = (mmap[5] === 0) ? parseInt(value, 10) : parseFloat(value);
						if (mmap[1] === 'eg') {
							let vcaNum = `vca${state.instrument.vcaOn + 1}`;
							console.log(vcaNum, mmap[2], value);
							actions.instrument.updateProp(vcaNum, mmap[2], value);
						} else {
							actions.instrument.updateProp(mmap[1], mmap[2], value);
						}
					}
					if (mmap && mmap[0] === 'studio') {
						let value = parseFloat(
							(mmap[2] || 0) + data.msg.value * (mmap[3] || 1) - data.msg.value * (mmap[2] || 0)
						).toFixed(mmap[4] || 3);
						value = (mmap[4] === 0) ? parseInt(value, 10) : parseFloat(value);
						actions.studio.change(mmap[1], value);
					}
					break;
				default:
					break;
			}
		});
};

module.exports = {
	hook
};
