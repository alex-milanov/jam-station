'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const {obj} = require('iblokz-data');
const a = require('../util/audio');
const {measureToBeatLength, bpmToTime} = require('../util/math');

// util
const indexAt = (a, k, v) => a.reduce((index, e, i) => ((obj.sub(e, k) === v) ? i : index), -1);
const objFilter = (o, f) => (
	// console.log(o, f),
	Object.keys(o)
		.filter((key, index) => f(key, o[key], index))
		.reduce((o2, key) =>
			obj.patch(o2, key, o[key]),
		{})
);

let changes$ = new Subject();

const initial = {
	// an dictionary midikey : vco
	/*
	voice: {
		vco1
		vco2
		adsr1
		adsr2
	}
	*/
	voices: {}, // a.start(a.vco({type: 'square'})),
	// adsr1: a.adsr({gain: 0}),
	vcf: a.vcf({cutoff: 0.64}),
	reverb: a.create('reverb'),
	// lfo: a.lfo({}),
	volume: a.vca({gain: 0.3}),
	context: a.context
};

const updatePrefs = instr => changes$.onNext(nodes =>
	obj.map(nodes,
		(key, node) => (instr[key])
			? a.update(node, instr[key])
			: (key === 'voices')
				? obj.map(node, (k, voice) => obj.map(voice, (key, n) => (instr[key])
					? a.update(n, instr[key])
					: n))
				: node));

const updateConnections = instr => changes$.onNext(nodes => Object.assign({}, nodes, {
	voices: obj.map(nodes.voices, (k, voice) => ({
		vco1: a.connect(voice.vco1, voice.adsr1),
		vco2: a.connect(voice.vco2, voice.adsr2),
		adsr1: (!instr.vco1.on)
			? a.disconnect(voice.adsr1)
			: a.reroute(voice.adsr1, (instr.reverb.on) ? nodes.reverb : (instr.vcf.on) ? nodes.vcf : nodes.volume),
		adsr2: (!instr.vco2.on)
			? a.disconnect(voice.adsr2)
			: a.reroute(voice.adsr2, (instr.reverb.on) ? nodes.reverb : (instr.vcf.on) ? nodes.vcf : nodes.volume)
	})),
	reverb: (instr.reverb.on)
		? a.reroute(nodes.reverb, (instr.vcf.on) ? nodes.vcf : nodes.volume)
		: a.disconnect(nodes.reverb),
	vcf: (instr.vcf.on)
		? a.reroute(nodes.vcf, nodes.volume)
		: a.disconnect(nodes.vcf),
	volume: a.connect(nodes.volume, nodes.context.destination)
}));

const noteOn = (instr, note, velocity, time) => changes$.onNext(nodes => {
	let {voices, vcf, volume, context, reverb} = nodes;

	const freq = a.noteToFrequency(note);

	// console.log(instr, note, velocity);

	let voice = voices[note] || false;

	if (voice.vco1) a.stop(voice.vco1);
	let vco1 = a.start(a.vco(Object.assign({}, instr.vco1, {freq})), time);
	let adsr1 = voice ? voice.adsr1 : a.adsr(instr.vca1);
	vco1 = a.connect(vco1, adsr1);
	adsr1 = !(instr.vco1.on)
		? a.disconnect(adsr1)
		: a.reroute(adsr1, (instr.reverb.on) ? reverb : (instr.vcf.on) ? vcf : volume);

	if (voice.vco2) a.stop(voice.vco2);
	let vco2 = a.start(a.vco(Object.assign({}, instr.vco2, {freq})), time);
	let adsr2 = voice ? voice.adsr2 : a.adsr(instr.vca2);
	vco2 = a.connect(vco2, adsr2);
	adsr2 = !(instr.vco2.on)
		? a.disconnect(adsr2)
		: a.reroute(adsr2, (instr.reverb.on) ? reverb : (instr.vcf.on) ? vcf : volume);

	if (instr.reverb.on) a.reroute(reverb, (instr.vcf.on) ? vcf : volume);
	else a.disconnect(reverb);

	// vcf
	vcf = (instr.vcf.on) ? a.reroute(vcf, volume) : a.disconnect(vcf);

	a.noteOn(adsr1, velocity, time);
	a.noteOn(adsr2, velocity, time);

	return Object.assign({}, nodes, {
		voices: obj.patch(voices, note, {
			vco1,
			vco2,
			adsr1,
			adsr2
		}),
		vcf,
		context});
});

const noteOff = (instr, note, time) => changes$.onNext(nodes => {
	const {voices, context} = nodes;
	const now = context.currentTime;
	time = time || now + 0.0001;

	let voice = voices[note] || false;

	if (voice) {
		let {vco1, adsr1, vco2, adsr2} = voice;

		a.noteOff(adsr1, time);
		a.noteOff(adsr2, time);

		a.stop(vco1, time + (instr.vca1.release > 0 && instr.vca1.release || 0.00001));
		a.stop(vco2, time + (instr.vca2.release > 0 && instr.vca2.release || 0.00001));

		setTimeout(() => {
			a.disconnect(vco1);
			a.disconnect(adsr1);
			a.disconnect(vco2);
			a.disconnect(adsr2);
		}, (time - now + instr.vca1.release) * 1000);

		return Object.assign({}, nodes, {voices: objFilter(voices, key => key !== note), context});
	}

	return nodes;
});

const pitchBend = (instr, pitchValue) => changes$.onNext(nodes =>
	obj.patch(nodes, 'voices', obj.map(nodes.voices, (key, voice) => Object.assign({}, voice, {
		vco1: a.update(voice.vco1, {detune: instr.vco1.detune + pitchValue * 200}),
		vco2: a.update(voice.vco2, {detune: instr.vco2.detune + pitchValue * 200})
	})))
);

const engine$ = new Rx.BehaviorSubject();

changes$
	.startWith(() => initial)
	.scan((engine, change) => change(engine), {})
	// .map(engine => (console.log(engine), engine))
	.subscribe(engine => engine$.onNext(engine));

const hook = ({state$, actions, studio, tapTempo}) => {
	// hook state changes
	const instrUpdates$ = state$
		.distinctUntilChanged(state => state.instrument)
		.map(state => state.instrument).share();
	// update connections
	instrUpdates$.distinctUntilChanged(instr => instr.vco1.on + instr.vco2.on + instr.vcf.on + instr.lfo.on)
		.subscribe(updateConnections);
	// update prefs
	instrUpdates$.subscribe(updatePrefs);

	state$.distinctUntilChanged(state => state.midiMap.channels)
		.map(state => ({
			state,
			pressed: Object.keys(state.midiMap.channels).filter(ch => parseInt(ch, 10) !== 10).reduce(
				(pressed, ch) => Object.assign({}, pressed, state.midiMap.channels[ch]),
				{}
			)
		}))
		.withLatestFrom(engine$, ({state, pressed}, engine) => ({state, pressed, engine}))
		.subscribe(({state, pressed, engine: {voices}}) => {
			// console.log(pressed);
			Object.keys(pressed).filter(note => !voices[note])
				.forEach(
					note => noteOn(state.instrument, note, pressed[note])
				);
			Object.keys(voices).filter(note => !pressed[note])
				.forEach(
					note => noteOff(state.instrument, note)
				);
		});

	// pitch bend
	state$.distinctUntilChanged(state => state.midiMap.pitch)
		.subscribe(state => pitchBend(state.instrument, state.midiMap.pitch));

	/*
	midiState$
		.filter(({data}) => data.msg.binary !== '11111000')
		.map(({state, data}) => (console.log(`midi: ${data.msg.binary}`, data.msg), ({state, data})))
		.subscribe(({data, state}) => {
			switch (data.msg.state) {
				case 'noteOn':
					if (data.msg.channel !== 10) {
						noteOn(state.instrument, data.msg.note, data.msg.velocity);
					} else {
						if (state.sequencer.channels[data.msg.note.number - 60])
							studio.kit[state.sequencer.channels[data.msg.note.number - 60]].clone().trigger({
								studio: {volume: state.studio.volume * data.msg.velocity}
							});
						if (state.studio.playing && state.studio.recording && state.studio.tick.index > -1) {
							actions.sequencer.toggle(state.sequencer.bar, data.msg.note.number - 60, state.studio.tick.index);
						}
					}
					break;
				case 'noteOff':
					if (data.msg.channel !== 10) noteOff(state.instrument, data.msg.note);
					break;
				case 'pitchBend':
					pitchBend(state.instrument, data.msg.pitchValue);
					break;
				case 'controller':
					if (state.midiMap.map.controller[data.msg.controller]) {
						let mmap = state.midiMap.map.controller[data.msg.controller];
						let [section, prop] = mmap;
						// adsr
						if (section === 'instrument' && prop[0] === 'eg') prop = [`adsr${state.instrument.adsrOn + 1}`, prop[1]];
						// value
						let valMods = mmap.slice(2);
						let val = prepVal.apply(null, valMods)(data.msg.value);

						if (section === 'instrument')
							updatePrefs(obj.patch(state.instrument, prop, val));
					}
					break;
				default:
					break;
			}
		});
		*/
	state$
		.distinctUntilChanged(state => state.studio.tick)
		.filter(state => state.studio.playing)
		.subscribe(({studio, instrument, pianoRoll}) => {
			if (studio.tick.index === studio.beatLength - 1 || studio.tick.elapsed === 1) {
				let start = (studio.tick.index === studio.beatLength - 1) ? 0 : studio.tick.index;
				let offset = (studio.tick.index === studio.beatLength - 1) ? 1 : 0;
				// let start = studio.tick.index;
				pianoRoll.events
					.filter(event => event.start >= start && event.duration > 0)
					.forEach(event => {
						let timepos = studio.tick.time + ((event.start - start + offset) * bpmToTime(studio.bpm));
						noteOn(instrument, event.note, event.velocity || 0.7, timepos);
						noteOff(instrument, event.note, timepos + event.duration * bpmToTime(studio.bpm));
					});
			}
		});
};

module.exports = {
	hook
};
