'use strict';

const {combineLatest, Subject, BehaviorSubject} = require('rxjs');
const {distinctUntilChanged, filter, map, take, scan, startWith, withLatestFrom} = require('rxjs/operators');

const {obj, fn, arr} = require('iblokz-data');
const a = require('iblokz-audio');
const m = require('../util/midi');
const sampler = require('iblokz-audio').sampler;
const {measureToBeatLength, bpmToTime} = require('../util/math');
const pocket = require('../util/pocket');

const prepPressed = (channels, track) => track.input.device > -1
	? channels[track.input.device] && channels[track.input.device][track.input.channel] || {}
	: Object.keys(channels)
		.reduce((cn, d) =>
			Object.keys(channels[d][track.input.channel] || {})
				.reduce((cn, note) =>
					obj.patch(cn, note, channels[d][track.input.channel][note] || cn[note]),
					cn
				),
			{}
		);

const globalVolume = a.connect(a.vca({gain: 0.4}), a.context.destination);

const reverb = a.connect(a.create('reverb', {
	on: true,
	wet: 0.1,
	dry: 0.9
}), globalVolume);

let changes$ = new Subject();
const engine$ = new BehaviorSubject();
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

const updatePrefs = (instr, ch = 1) => changes$.next(engine =>
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

const updateConnections = (instr, ch = 1) => changes$.next(engine => obj.patch(engine, ch, {
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
	volume: a.connect(engine[ch].volume, globalVolume)
	// lfo: (instr.lfo.on)
	// 	? a.reroute(engine[ch].lfo, engine[ch].volume.through.gain)
	// 	: a.disconnect(engine[ch].lfo)
}));

const noteOn = (instr, ch = 1, note, velocity, time, mute = false) => changes$.next(engine => {
	let {voices, vcf, lfo, volume, context, reverb} = engine[ch];
	time = time || context.currentTime;

	const freq = a.noteToFrequency(note);

	// console.log(instr, note, velocity);

	let voice = voices[note] || false;

	if (voice.vco1 && buffer.indexOf(voice.vco1) > -1) {
		arr.remove(buffer, voice.vco1);
		a.stop(voice.vco1);
	}
	let vco1 = a.vco(Object.assign({}, instr.vco1, {freq}));
	if (!mute) vco1 = a.start(vco1, time);
	let adsr1 = voice ? voice.adsr1 : a.adsr(instr.vca1);
	vco1 = a.connect(vco1, adsr1);
	adsr1 = !(instr.vco1.on)
		? a.disconnect(adsr1)
		: a.reroute(adsr1, (instr.reverb.on) ? reverb : (instr.vcf.on) ? vcf : volume);

	if (voice.vco2 && buffer.indexOf(voice.vco2) > -1) {
		arr.remove(buffer, voice.vco2);
		a.stop(voice.vco2);
	}
	let vco2 = a.vco(Object.assign({}, instr.vco2, {freq}));
	if (!mute) vco2 = a.start(vco2, time);
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
	if (!mute) {
		buffer.push(vco1);
		buffer.push(vco2);
	}

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

const noteOff = (instr, ch = 1, note, time, mute = false) => changes$.next(engine => {
	const {voices, context} = engine[ch];
	const now = context.currentTime;
	time = time || now + 0.0001;

	let voice = voices[note] || false;

	if (voice) {
		let {vco1, adsr1, vco2, adsr2} = voice;

		if (!mute) {
			a.noteOff(adsr1, time);
			a.noteOff(adsr2, time);

			a.stop(vco1, time + (instr.vca1.release > 0 && instr.vca1.release || 0.00001));
			a.stop(vco2, time + (instr.vca2.release > 0 && instr.vca2.release || 0.00001));
		}
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

const pitchBend = (instr, pitchValue, ch = 1) => changes$.next(engine =>
	obj.patch(engine, [ch, 'voices'], obj.map(engine[ch].voices, (key, voice) => Object.assign({}, voice, {
		vco1: a.update(voice.vco1, {detune: instr.vco1.detune + pitchValue * 200}),
		vco2: a.update(voice.vco2, {detune: instr.vco2.detune + pitchValue * 200})
	})))
);

const sendMIDImsg = (device, note, velocity, delay = 0, channel = 1) => (
	// console.log(device, note, velocity, delay),
	device && device.send(
		[0x90 + (channel - 1), m.noteToNumber(note), `0x${parseInt(velocity * 127, 10).toString(16)}`],
		window.performance.now() + delay * 1000
	)
);

changes$.pipe(
	startWith(() => initial),
	scan((engine, change) => change(engine), initial)
	// map(engine => (console.log(engine), engine))
).subscribe(engine => engine$.next(engine));

const hook = ({state$, actions, studio, tapTempo}) => {
	const sampleBank$ = pocket.stream.pipe(
		filter(p => p.sampleBank),
		distinctUntilChanged((prev, curr) => {
			const prevBank = prev.sampleBank;
			const currBank = curr.sampleBank;
			return prevBank === currBank;
		}),
		map(p => p.sampleBank)
	);

	state$.pipe(
		distinctUntilChanged((prev, curr) => prev.studio.playing === curr.studio.playing),
		filter(state => !state.studio.playing)
	).subscribe(() => clearBuffer());

	state$.pipe(
		distinctUntilChanged((prev, curr) => prev.studio.bpm === curr.studio.bpm),
		filter(state => state.studio.playing)
	).subscribe(() => clearBuffer());

	// update connections
	state$.pipe(
		distinctUntilChanged((prev, curr) => {
			const prevTracks = prev.session.tracks.map((track, ch) =>
				ch > 0 && [track.inst.vco1.on, track.inst.vco2.on, track.inst.vcf.on, track.inst.lfo.on, track.inst.reverb.on]
			);
			const currTracks = curr.session.tracks.map((track, ch) =>
				ch > 0 && [track.inst.vco1.on, track.inst.vco2.on, track.inst.vcf.on, track.inst.lfo.on, track.inst.reverb.on]
			);
			return JSON.stringify(prevTracks) === JSON.stringify(currTracks);
		})
	).subscribe(({instrument, session}) => session.tracks.forEach(
		(track, ch) => ch > 0 && updateConnections(track.inst, ch))
	);
	// update prefs
	state$.pipe(
		distinctUntilChanged((prev, curr) => {
			const prevInsts = prev.session.tracks.map(track => track.inst);
			const currInsts = curr.session.tracks.map(track => track.inst);
			return JSON.stringify(prevInsts) === JSON.stringify(currInsts);
		})
	).subscribe(({instrument, session}) => session.tracks.forEach(
		(track, ch) => ch > 0 && updatePrefs(track.inst, ch))
	);

	// global volume
	state$.pipe(
		distinctUntilChanged((prev, curr) => prev.studio.volume === curr.studio.volume)
	).subscribe(state => a.update(globalVolume, {gain: state.studio.volume}));

	// set up once
	state$.pipe(
		take(1)
	).subscribe(({instrument, session}) => session.tracks
		.map((track, ch) => ({track, ch}))
		.filter(({track}) => track.type === 'piano')
		.forEach(({track, ch}) => (
			updateConnections(Object.assign({}, instrument, track.inst), ch),
			updatePrefs(Object.assign({}, instrument, track.inst), ch)
		))
	);

	// note ons
	let voices = {};
	const notesPattern = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	state$.pipe(
		distinctUntilChanged((prev, curr) => {
			return JSON.stringify(prev.midiMap.channels) === JSON.stringify(curr.midiMap.channels);
		}),
		map(state => ({
			state,
			pressed: state.session.tracks.map(track => (
				// console.log(track.input),
				prepPressed(
					state.midiMap.channels,
					track
				)
			))
		})),
		withLatestFrom(engine$, sampleBank$),
		map(([{state, pressed}, engine, sampleBank]) =>
			({state, pressed, engine, sampleBank}))
	)
		.subscribe(({state, pressed, engine, sampleBank}) => {
			Object.keys(pressed).forEach(ch => {
				if (ch > 0) {
					// console.log(ch, pressed[ch], engine[ch], state.midiMap.channels);
					if (!state.midiMap.settings.midiRouteToActive || Number(state.session.selection.piano[0]) === Number(ch)) {
						let voices = engine[ch].voices;
						Object.keys(pressed[ch] || [])
							.filter(note => !obj.sub(voices, [note]))
							.forEach(
								note =>
									(state.session.tracks[ch].output && state.session.tracks[ch].output.device > -1)
										? (
											// console.log(pressed[ch][note]),
											console.log(state.session.tracks[ch].output.device),
											sendMIDImsg(state.midiMap.devices.outputs[
												state.session.tracks[ch].output.device
											], note, pressed[ch][note] || 1, 0, state.session.tracks[ch].output.channel),
											noteOn(state.session.tracks[ch].inst, ch, note, pressed[ch][note], null, true)
										)
										: noteOn(state.session.tracks[ch].inst, ch, note, pressed[ch][note])
							);
						Object.keys(voices)
							.filter(note => !obj.sub(pressed, [ch, note]))
							.forEach(
								note =>
									(state.session.tracks[ch].output && state.session.tracks[ch].output.device > -1)
										? (
											sendMIDImsg(state.midiMap.devices.outputs[
												state.session.tracks[ch].output.device
											], note, 0, 0, state.session.tracks[ch].output.channel),
											noteOff(state.session.tracks[ch].inst, ch, note, null, true)
										)
										: noteOff(state.session.tracks[ch].inst, ch, note)
							);
					}
				} else {
					Object.keys(pressed[ch]).filter(note => !voices[note])
						.forEach(
							note => {
								console.log(note);
								const track = state.session.tracks[ch];
								const index = notesPattern.indexOf(note.replace(/[0-9]/, ''));
								if (index > -1 && state.sequencer.channels[index]) {
									if (track.output.device !== -1) {
										sendMIDImsg(state.midiMap.devices.outputs[
											track.output.device
										], note, pressed[ch][note], 0, track.output.channel);
										sendMIDImsg(state.midiMap.devices.outputs[
											track.output.device
										], note, 0, bpmToTime(state.studio.bpm) / 4, track.output.channel);
									} else if (sampleBank[
										state.mediaLibrary.files[
											state.sequencer.channels[index]
										]
									]) {
										let inst = sampler.clone(sampleBank[
											state.mediaLibrary.files[
												state.sequencer.channels[index]
											]
										], {gain: pressed[ch][note]});
										a.connect(inst, reverb);
										setTimeout(() => a.start(inst));
										voices[note] = inst;
									}
								}
							}
						);
					Object.keys(voices).filter(note => !pressed[ch][note])
						.forEach(
							note => {
								if (voices[note]) {
									let inst = voices[note];
									voices = obj.filter(voices, key => key !== note);
									setTimeout(() => {
										a.disconnect(inst, reverb);
										a.stop(inst);
									}, 3000);
								}
							}
						);
				}
			});
		});

	// pitch bend
	state$.pipe(
		distinctUntilChanged((prev, curr) => prev.midiMap.pitch === curr.midiMap.pitch)
	)
		.subscribe(state => pitchBend(
			Object.assign({}, state.instrument, state.session.tracks[
				state.session.selection.piano[0]
			].inst), state.midiMap.pitch, state.session.selection.piano[0])
		);

	combineLatest([
		state$.pipe(
			distinctUntilChanged((prev, curr) => {
				const prevTick = prev.studio.tick;
				const currTick = curr.studio.tick;
				return prevTick.index === currTick.index && prevTick.elapsed === currTick.elapsed;
			}),
			filter(state => state.studio.playing)
		),
		sampleBank$
	]).pipe(
		map(([state, sampleBank]) => ({state, sampleBank}))
	)
		.subscribe(({state: {studio, session, sequencer, mediaLibrary, instrument, midiMap}, sampleBank}) => {
			if (studio.tick.index === studio.beatLength - 1 || studio.tick.elapsed === 0) {
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
									if (row && row[i]) {
										if (track.output.device !== -1) {
											sendMIDImsg(midiMap.devices.outputs[
												track.output.device
											], fn.pipe(
												() => m.numberToNote(60 + k),
												({key, octave}) => `${key}${octave}`
											)(), row[i], timepos - a.context.currentTime, track.output.channel);
											sendMIDImsg(midiMap.devices.outputs[
												track.output.device
											], fn.pipe(
												() => m.numberToNote(60 + k),
												({key, octave}) => `${key}${octave}`
											)(), 0, timepos + bpmToTime(studio.bpm) / 4 - a.context.currentTime, track.output.channel);
										} else if (sampleBank[
											mediaLibrary.files[
												sequencer.channels[k]
											]
										]) {
											// console.log(sequencer.channels[k]);
											let inst = sampler.clone(sampleBank[
												mediaLibrary.files[
													sequencer.channels[k]
												]
											], {gain: row[i]});
											inst = a.connect(inst, reverb);
											a.start(inst, timepos);
											// inst.trigger({studio}, timepos);
											buffer.push(inst);
										}
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
										let timepos = studio.tick.time + ((event.start - bar.start - start + offset) *
											bpmToTime(studio.bpm));
										if (track.output && track.output.device > -1) {
											// note on
											sendMIDImsg(midiMap.devices.outputs[
												track.output.device
											], event.note, event.velocity || 1, timepos - a.context.currentTime, track.output.channel);
											noteOn(
												Object.assign({}, instrument, track.inst),
												ch, event.note, event.velocity || 0.7, timepos, true
											);
											// note off
											sendMIDImsg(midiMap.devices.outputs[
												track.output.device
											], event.note, 0,
												(timepos + event.duration * bpmToTime(studio.bpm) - a.context.currentTime),
												track.output.channel);
											noteOff(
												Object.assign({}, instrument, track.inst),
												ch, event.note, timepos + event.duration * bpmToTime(studio.bpm), true
											);
										} else {
											noteOn(
												Object.assign({}, instrument, track.inst),
												ch, event.note, event.velocity || 0.7, timepos
											);
											noteOff(
												Object.assign({}, instrument, track.inst),
												ch, event.note, timepos + event.duration * bpmToTime(studio.bpm)
											);
										}
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
