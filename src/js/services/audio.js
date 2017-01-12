'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const obj = require('iblokz/common/obj');
const a = require('../util/audio');

// util
const mapObj = (o, cb) => Object.keys(o)
	.reduce(
		(o2, k, i) =>
			((o2[k] = cb(o[k], k, i)), o2),
		{});

let changes$ = new Subject();

const initial = {
	// an dictionary midikey : vco
	vco1: {}, // a.start(a.vco({type: 'square'})),
	vco2: {}, // a.start(a.vco({type: 'square'})),
	vca1: a.vca({gain: 0}),
	vcf: a.vcf({}),
	// lfo: a.lfo({}),
	volume: a.vca({gain: 0.7}),
	context: a.context
};

const updatePrefs = instr => changes$.onNext(nodes =>
	mapObj(nodes,
		(node, key) => (instr[key])
			? ['vco1', 'vco2'].indexOf(key) > -1
				? mapObj(node, n => a.apply(n, instr[key]))
				: a.apply(node, instr[key])
			: node));
/*
Object.keys(nodes).reduce((o, node) =>
(instr[node])
? obj.patch(o, node, a.apply(nodes[node], instr[node]))
: o,
nodes
)
*/

const updateConnections = instr => changes$.onNext(nodes => {
	//
	let {vco1, vco2, vca1, vcf, volume, context} = nodes;

	// oscillators
	if (!instr.vco1.on) vco1 = mapObj(vco1, vco => a.disconnect(vco));
	if (!instr.vco2.on) vco2 = mapObj(vco2, vco => a.disconnect(vco));

	// vcf
	if (instr.vcf.on) {
		if (instr.vco1.on) vco1 = mapObj(vco1, vco => a.reroute(vco, vcf));
		if (instr.vco2.on) vco2 = mapObj(vco2, vco => a.reroute(vco, vcf));
		vcf = a.connect(vcf, vca1);
	} else {
		vcf = a.disconnect(vcf, vca1);
		if (instr.vco1.on) vco1 = mapObj(vco1, vco => a.reroute(vco, vca1));
		if (instr.vco2.on) vco2 = mapObj(vco2, vco => a.reroute(vco, vca1));
	}

	vca1 = a.connect(vca1, volume);
	volume = a.connect(volume, context.destination);

	return Object.assign({}, nodes, {vco1, vco2, vca1, vcf, volume, context});
});

const noteOn = (instr, note, velocity) => changes$.onNext(nodes => {
	let {vca1, vcf, context} = nodes;

	const now = context.currentTime;
	const time = now + 0.0001;

	console.log(instr, note, velocity);

	let vco1 = a.start(a.vco(instr.vco1));
	let vco2 = a.start(a.vco(instr.vco2));

	// vcf
	if (instr.vcf.on) {
		if (instr.vco1.on) vco1 = a.connect(vco1, vcf);
		if (instr.vco2.on) vco2 = a.connect(vco2, vcf);
		vcf = a.connect(vcf, vca1);
	} else {
		vcf = a.disconnect(vcf, vca1);
		if (instr.vco1.on) vco1 = a.connect(vco1, vca1);
		if (instr.vco2.on) vco2 = a.connect(vco2, vca1);
	}

	vco1.node.frequency.cancelScheduledValues(0);
	vco2.node.frequency.cancelScheduledValues(0);
	vca1.node.gain.cancelScheduledValues(0);

	const freq = a.noteToFrequency(note.key + note.octave);

	vco1.node.frequency.value = freq;
	vco2.node.frequency.value = freq;

	// attack
	if (instr.vca1.attack > 0)
		vca1.node.gain.setValueCurveAtTime(new Float32Array([0, velocity * instr.vca1.volume]), time, instr.vca1.attack);
	else
		vca1.node.gain.setValueAtTime(velocity, now);

	// decay
	if (instr.vca1.decay > 0)
		vca1.node.gain.setValueCurveAtTime(
			new Float32Array([velocity * instr.vca1.volume, instr.vca1.sustain * velocity * instr.vca1.volume]),
			time + instr.vca1.attack, instr.vca1.decay);

	return Object.assign({}, nodes, {
		vco1: obj.patch(nodes.vco1, note.number, vco1),
		vco2: obj.patch(nodes.vco2, note.number, vco2),
		vcf,
		vca1, context});
});

const noteOff = (instr, note) => changes$.onNext(nodes => {
	const {vca1, context} = nodes;
	const now = context.currentTime;
	const time = now + 0.0001;

	vca1.node.gain.cancelScheduledValues(0);
	vca1.node.gain.setValueCurveAtTime(new Float32Array([vca1.node.gain.value, 0]),
		time, instr.vca1.release > 0 && instr.vca1.release || 0.00001);

	if (nodes.vco1[note.number])
		a.stop(nodes.vco1[note.number], time + (instr.vca1.release > 0 && instr.vca1.release || 0.00001));
	if (nodes.vco2[note.number])
		a.stop(nodes.vco2[note.number], time + (instr.vca1.release > 0 && instr.vca1.release || 0.00001));

	// todo maybe delete vco nodes as well

	return Object.assign({}, nodes, {vca1, context});
});

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
		.map(data => (console.log('midi: ', data.msg), data))
		.withLatestFrom(state$, (data, state) => ({data, state}))
		.subscribe(({data, state}) => {
			switch (data.msg.state) {
				case 'noteOn':
					noteOn(state.instrument, data.msg.note, data.msg.velocity);
					break;
				case 'noteOff':
					noteOff(state.instrument, data.msg.note);
					break;
				default:
					break;
			}
		});
};

module.exports = {
	hook
};
