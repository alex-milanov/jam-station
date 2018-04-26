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
		// lfo: a.lfo({}),
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
		// lfo: a.lfo({}),
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
		// lfo: a.lfo({}),
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
}));

const noteOn = (instr, ch = 1, note, velocity, time) => changes$.onNext(engine => {
	let {voices, vcf, volume, context, reverb} = engine[ch];

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

	// if (instr.reverb.on) a.reroute(reverb, (instr.vcf.on) ? vcf : volume);
	// else a.disconnect(reverb);

	// vcf
	// vcf = (instr.vcf.on) ? a.reroute(vcf, volume) : a.disconnect(vcf);

	a.noteOn(adsr1, velocity, time);
	a.noteOn(adsr2, velocity, time);

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

		return obj.patch(engine, ch, {voices: objFilter(voices, key => key !== note), context});
	}

	return engine;
});

const pitchBend = (instr, pitchValue, ch = 1) => changes$.onNext(engine =>
	obj.patch(engine, [ch, 'voices'], obj.map(engine[ch].voices, (key, voice) => Object.assign({}, voice, {
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
	// const instrUpdates$ = state$
	// 	.distinctUntilChanged(state => state.instrument)
	// 	.map(state => state.instrument).share();
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

	// pitch bend
	state$.distinctUntilChanged(state => state.midiMap.pitch)
		.subscribe(state => pitchBend(
			Object.assign({}, state.instrument, state.session.tracks[
				state.session.selection.piano[0]
			].inst), state.midiMap.pitch, state.session.selection.piano[0])
		);

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
		.subscribe(({studio, session, instrument}) => {
			if (studio.tick.index === studio.beatLength - 1 || studio.tick.elapsed === 1) {
				let b = (studio.tick.tracks[session.selection.piano[0]]
					&& studio.tick.tracks[session.selection.piano[0]].bar) || 0;

				const barsLength =
					session.tracks[session.selection.piano[0]]
					&& session.tracks[session.selection.piano[0]].measures[0]
					&& session.tracks[session.selection.piano[0]].measures[0].barsLength || 1;

				if (studio.tick.index === studio.beatLength - 1)
					b = (b < barsLength - 1) ? b + 1 : 0;

				const bar = {
					start: studio.beatLength * b,
					end: studio.beatLength * (b + 1)
				};
				console.log(bar);

				let start = (studio.tick.index === studio.beatLength - 1) ? 0 : studio.tick.index;
				let offset = (studio.tick.index === studio.beatLength - 1) ? 1 : 0;
				// let start = studio.tick.index;
				session.tracks
					.map((track, ch) => ({track, ch}))
					.filter(({track}) => track.type === 'piano')
					.forEach(({track, ch}) =>
						track.measures[0] && track.measures[0].events && track.measures[0].events
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
					);
			}
		});
};

module.exports = {
	hook
};
