'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const Subject = Rx.Subject;

const {obj, fn, arr} = require('iblokz-data');
const a = require('../util/audio');
const sampler = require('../util/audio/sources/sampler');
const {measureToBeatLength, bpmToTime} = require('../util/math');
const pocket = require('../util/pocket');

const reverb = a.create('reverb', {
	on: true,
	wet: 0.1,
	dry: 0.9
});
a.connect(reverb, a.context.destination);

let changes$ = new Subject();
const engine$ = new Rx.BehaviorSubject();
let buffer = [];

const clearBuffer = () => {
	// console.log(buffer);
	buffer.forEach(inst => {
		// console.log(inst);
		a.disconnect(inst); // .output.disconnect(reverb.input);
		a.stop(inst);
	});
	buffer = [];
};

const initial = {
	1: {
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
		lfo: a.start(a.lfo({})),
		volume: a.vca({gain: 0.3}),
		context: a.context
	},
	2: {
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
		lfo: a.start(a.lfo({})),
		volume: a.vca({gain: 0.3}),
		context: a.context
	},
	3: {
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
		lfo: a.start(a.lfo({})),
		volume: a.vca({gain: 0.3}),
		context: a.context
	}
};

const updatePrefs = (instr, ch = 1) => changes$.onNext(engine =>
	obj.patch(engine, ch,
		obj.map(engine[ch],
			(key, node) => (instr[key])
				? a.update(node, instr[key])
				: (key === 'voices')
					? obj.map(node, (k, voice) => obj.map(voice, (key, n) => (instr[key])
						? a.update(n, instr[key])
						: n))
					: node)
		)
	);

const updateConnections = (instr, ch = 1) => changes$.onNext(engine => obj.patch(engine, ch, {
	voices: obj.map(engine[ch].voices, (k, voice) => ({
		vco1: a.connect(voice.vco1, voice.adsr1),
		vco2: a.connect(voice.vco2, voice.adsr2),
		adsr1: (!instr.vco1.on)
			? a.disconnect(voice.adsr1)
			: a.reroute(voice.adsr1, (instr.reverb.on)
				? engine[ch].reverb : (instr.vcf.on)
					? engine[ch].vcf : engine[ch].volume),
		adsr2: (!instr.vco2.on)
			? a.disconnect(voice.adsr2)
			: a.reroute(voice.adsr2, (instr.reverb.on)
				? engine[ch].reverb : (instr.vcf.on)
					? engine[ch].vcf : engine[ch].volume)
	})),
	reverb: (instr.reverb.on)
		? a.reroute(engine[ch].reverb, (instr.vcf.on) ? engine[ch].vcf : engine[ch].volume)
		: a.disconnect(engine[ch].reverb),
	vcf: (instr.vcf.on)
		? a.reroute(engine[ch].vcf, engine[ch].volume)
		: a.disconnect(engine[ch].vcf),
	volume: a.connect(engine[ch].volume, engine[ch].context.destination)
	// lfo: (instr.lfo.on)
	// 	? a.reroute(engine[ch].lfo, engine[ch].volume.through.gain)
	// 	: a.disconnect(engine[ch].lfo)
}));

const noteOn = (instr, ch = 1, note, velocity, time) => changes$.onNext(engine => {
	let {voices, vcf, lfo, volume, context, reverb} = engine[ch];

	const freq = a.noteToFrequency(note);

	// console.log(instr, note, velocity);

	let voice = voices[note] || false;

	if (voice.vco1) {
		arr.remove(buffer, voice.vco1);
		a.stop(voice.vco1);
	}
	let vco1 = a.start(a.vco(Object.assign({}, instr.vco1, {freq})), time);
	let adsr1 = voice ? voice.adsr1 : a.adsr(instr.vca1);
	vco1 = a.connect(vco1, adsr1);
	adsr1 = !(instr.vco1.on)
		? a.disconnect(adsr1)
		: a.reroute(adsr1, (instr.reverb.on) ? reverb : (instr.vcf.on) ? vcf : volume);

	if (voice.vco2) {
		arr.remove(buffer, voice.vco2);
		a.stop(voice.vco2);
	}
	let vco2 = a.start(a.vco(Object.assign({}, instr.vco2, {freq})), time);
	let adsr2 = voice ? voice.adsr2 : a.adsr(instr.vca2);
	vco2 = a.connect(vco2, adsr2);
	adsr2 = !(instr.vco2.on)
		? a.disconnect(adsr2)
		: a.reroute(adsr2, (instr.reverb.on) ? reverb : (instr.vcf.on) ? vcf : volume);

	if (instr.lfo.on) {
		if (instr.lfo.target === 'pitch') {
			lfo.output.connect(vco1.output.detune);
			lfo.output.connect(vco2.output.detune);
		} else {
			lfo.effect.connect(adsr1.through.gain);
			lfo.effect.connect(adsr2.through.gain);
		}
	}

	// if (instr.reverb.on) a.reroute(reverb, (instr.vcf.on) ? vcf : volume);
	// else a.disconnect(reverb);

	// vcf
	// vcf = (instr.vcf.on) ? a.reroute(vcf, volume) : a.disconnect(vcf);

	a.noteOn(adsr1, velocity, time);
	a.noteOn(adsr2, velocity, time);

	buffer.push(vco1);
	buffer.push(vco2);

	return obj.patch(engine, ch, {
		voices: obj.patch(voices, note, {
			vco1,
			vco2,
			adsr1,
			adsr2
		}),
		vcf,
		reverb,
		context});
});

const noteOff = (instr, ch = 1, note, time) => changes$.onNext(engine => {
	const {voices, context} = engine[ch];
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

		return obj.patch(engine, ch, {voices: obj.filter(voices, key => key !== note), context});
	}

	return engine;
});

const pitchBend = (instr, pitchValue, ch = 1) => changes$.onNext(engine =>
	obj.patch(engine, [ch, 'voices'], obj.map(engine[ch].voices, (key, voice) => Object.assign({}, voice, {
		vco1: a.update(voice.vco1, {detune: instr.vco1.detune + pitchValue * 200}),
		vco2: a.update(voice.vco2, {detune: instr.vco2.detune + pitchValue * 200})
	})))
);

changes$
	.startWith(() => initial)
	.scan((engine, change) => change(engine), {})
	// .map(engine => (console.log(engine), engine))
	.subscribe(engine => engine$.onNext(engine));

const hook = ({state$, actions, studio, tapTempo}) => {
	const sampleBank$ = pocket.stream
		.filter(pocket => pocket.sampleBank)
		.distinctUntilChanged(pocket => pocket.sampleBank)
		.map(pocket => pocket.sampleBank);

	state$.distinctUntilChanged(state => state.studio.playing)
		.filter(state => !state.studio.playing)
		.subscribe(() => clearBuffer());

	state$.distinctUntilChanged(state => state.studio.bpm)
		.filter(state => state.studio.playing)
		.subscribe(() => clearBuffer());

	// update connections
	state$
		.distinctUntilChanged(
			({instrument}) => instrument.vco1.on + instrument.vco2.on + instrument.vcf.on + instrument.lfo.on
		)
		.subscribe(({instrument, session}) => updateConnections(instrument, session.selection.piano[0]));
	// update prefs
	state$
		.distinctUntilChanged(state => state.instrument)
		.subscribe(({instrument, session}) => updatePrefs(instrument, session.selection.piano[0]));

	// set up once
	state$.take(1)
		.subscribe(({instrument, session}) => session.tracks
			.map((track, ch) => ({track, ch}))
			.filter(({track}) => track.type === 'piano')
			.forEach(({track, ch}) => (
				updateConnections(Object.assign({}, instrument, track.inst), ch),
				updatePrefs(Object.assign({}, instrument, track.inst), ch)
			))
		);

	state$
		.distinctUntilChanged(state => state.midiMap.channels)
		.map(state => ({
			state,
			pressed: Object.keys(state.midiMap.channels).filter(ch => parseInt(ch, 10) !== 10).reduce(
				(pressed, ch) => Object.assign({}, pressed, state.midiMap.channels[ch]),
				{}
			)
		}))
		.withLatestFrom(engine$, ({state, pressed}, engine) => ({state, pressed, engine}))
		.subscribe(({state, pressed, engine: {[state.session.selection.piano[0]]: {voices}}}) => {
			// console.log(pressed);
			Object.keys(pressed).filter(note => !voices[note])
				.forEach(
					note => noteOn(state.instrument, state.session.selection.piano[0], note, pressed[note])
				);
			Object.keys(voices).filter(note => !pressed[note])
				.forEach(
					note => noteOff(state.instrument, state.session.selection.piano[0], note)
				);
		});

	let voices = {};
	const notesPattern = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	state$.distinctUntilChanged(state => state.midiMap.channels)
		.map(state => ({
			state,
			pressed: Object.keys(state.midiMap.channels).filter(ch => parseInt(ch, 10) === 10).reduce(
				(pressed, ch) => Object.assign({}, pressed, state.midiMap.channels[ch]),
				{}
			)
		}))
		.combineLatest(sampleBank$, ({state, pressed}, sampleBank) => ({state, pressed, sampleBank}))
		.subscribe(({state, pressed, sampleBank}) => {
			// console.log(pressed);
			Object.keys(pressed).filter(note => !voices[note])
				.forEach(
					note => {
						const index = notesPattern.indexOf(note.replace(/[0-9]/, ''));
						if (index > -1 && state.sequencer.channels[index]) {
							let inst = sampler.clone(sampleBank[
								state.mediaLibrary.files[
									state.sequencer.channels[index]
								]
							]);
							a.connect(inst, reverb);
							setTimeout(() => a.start(inst));
							voices[note] = inst;
						}
					}
				);
			Object.keys(voices).filter(note => !pressed[note])
				.forEach(
					note => {
						if (voices[note]) {
							setTimeout(() => {
								voices[note].output.disconnect(reverb.input);
								a.stop(voices[note]);
								voices = obj.filter(voices, key => key !== note);
							});
						}
					}
				);
		});

	// pitch bend
	state$.distinctUntilChanged(state => state.midiMap.pitch)
		.subscribe(state => pitchBend(
			Object.assign({}, state.instrument, state.session.tracks[
				state.session.selection.piano[0]
			].inst), state.midiMap.pitch, state.session.selection.piano[0])
		);

	state$
		.distinctUntilChanged(state => state.studio.tick)
		.filter(state => state.studio.playing)
		.combineLatest(sampleBank$, (state, sampleBank) => ({state, sampleBank}))
		.subscribe(({state: {studio, session, sequencer, mediaLibrary, instrument}, sampleBank}) => {
			if (studio.tick.index === studio.beatLength - 1 || studio.tick.elapsed === 0 || buffer.length === 0) {
				let start = (studio.tick.index === studio.beatLength - 1) ? 0 : studio.tick.index;
				let offset = (studio.tick.index === studio.beatLength - 1) ? 1 : 0;
				// let start = studio.tick.index;
				session.tracks
					.map((track, ch) => ({track, ch}))
					// .filter(({track}) => track.type === 'piano')
					.forEach(({track, ch}) => obj.switch(track.type, {
						seq: () => {
							for (let i = start; i < studio.beatLength; i++) {
								let timepos = studio.tick.time + ((i - start + offset) * bpmToTime(studio.bpm));
								// console.log({timepos, start, offset, i});
								sequencer.pattern[
									(studio.tick.index === studio.beatLength - 1)
										? (studio.tick.bar < sequencer.barsLength - 1) ? studio.tick.bar + 1 : 0
										: studio.tick.bar
								].forEach((row, k) => {
									if (row[i]) {
										// console.log(sequencer.channels[k]);
										let inst = sampler.clone(sampleBank[
											mediaLibrary.files[
												sequencer.channels[k]
											]
										]);
										inst = a.connect(inst, reverb);
										a.start(inst, timepos);
										// inst.trigger({studio}, timepos);
										buffer.push(inst);
									}
								});
							}
						},
						piano: () => fn.pipe(
							() => ({
								barIndex: studio.tick.tracks[ch].bar,
								barsLength: parseInt(track.measures[session.active[ch]]
									&& track.measures[session.active[ch]].barsLength || 1, 10)
							}),
							({barIndex, barsLength}) => ({
								barIndex: (barIndex < barsLength - 1 && studio.tick.elapsed > 1) ? barIndex + 1 : 0,
								barsLength
							}),
							({barIndex, barsLength}) => ({
								barIndex,
								barsLength,
								bar: {
									start: studio.beatLength * barIndex,
									end: studio.beatLength * (barIndex + 1)
								}
							}),
							// data => (console.log(studio.tick.tracks[ch], data), data),
							({bar}) => track.measures[session.active[ch]] && track.measures[session.active[ch]].events
								&& track.measures[session.active[ch]].events
									.filter(event => event.start >= bar.start + start && event.start < bar.end && event.duration > 0)
									.forEach(event => {
										let timepos = studio.tick.time + ((event.start - bar.start - start + offset) * bpmToTime(studio.bpm));
										noteOn(
											Object.assign({}, instrument, track.inst),
											ch, event.note, event.velocity || 0.7, timepos
										);
										noteOff(
											Object.assign({}, instrument, track.inst),
											ch, event.note, timepos + event.duration * bpmToTime(studio.bpm)
										);
									})
							)()
					})()
				);
			}
		});
};

module.exports = {
	hook
};
