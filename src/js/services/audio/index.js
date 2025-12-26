'use strict';

const {combineLatest, Subject, BehaviorSubject} = require('rxjs');
const {distinctUntilChanged, filter, map, take, scan, startWith, withLatestFrom} = require('rxjs/operators');

const {obj, fn, arr} = require('iblokz-data');
const a = require('iblokz-audio');
const m = require('../../util/midi');
const sampler = require('iblokz-audio').sampler;
const {measureToBeatLength, bpmToTime} = require('../../util/math');
const pocket = require('../../util/pocket');
const nodes = require('./util/nodes');

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

/**
 * The changes$ Subject is used to emit changes to the engine state
 * @type {Subject}
 */
let changes$ = new Subject();

/**
 * The engine$ BehaviorSubject is used to emit the current engine state
 * @type {BehaviorSubject}
 */
const engine$ = new BehaviorSubject();

/**
 * The buffer of stopped instances
 * @type {Array}
 */
let buffer = [];

/**
 * Clear the buffer of stopped instances
 */
const clearBuffer = () => {
	// console.log(buffer);
	buffer.forEach(inst => {
		// console.log(inst);
		a.disconnect(inst); // .output.disconnect(reverb.input);
		a.stop(inst);
	});
	buffer = [];
};

/**
 * The initial engine state
 * @type {Object}
 */
const initial = {
	0: {
		// sampler track
		voices: {}, // sampler instances keyed by note
		effectsChain: [], // Will be synced from session tracks
		volume: a.vca({gain: 0.3}),
		context: a.context
	},
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
		effectsChain: [], // Will be synced from session tracks
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
		effectsChain: [], // Will be synced from session tracks
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
		effectsChain: [], // Will be synced from session tracks
		volume: a.vca({gain: 0.3}),
		context: a.context
	}
};

// type:id
const getEffectChainMap = effectChain => effectChain
	.filter(effect => effect.on)
	.map(effect =>
		`${effect.type}:${effect.id}`
	);

const getEffectChainDiff = (oldEffectChain, newEffectChain) => fn.pipe(
	() => ({
		oldEffectChainMap: getEffectChainMap(oldEffectChain),
		newEffectChainMap: getEffectChainMap(newEffectChain)
	}),
	({oldEffectChainMap, newEffectChainMap}) => ({
		added: newEffectChainMap.filter(effect => !oldEffectChainMap.includes(effect)),
		removed: oldEffectChainMap.filter(effect => !newEffectChainMap.includes(effect)),
		typeChanged: newEffectChainMap
			.filter(effect => oldEffectChainMap.find(e =>
				e.split(':')[1] === effect.split(':')[1]
				&& e.split(':')[0] !== effect.split(':')[0])),
		orderChanged: newEffectChainMap
			.filter((effect, index) => oldEffectChainMap.find((e, i) =>
				e === effect && i !== index)
		)
	}))();

/**
 * Sync the engine's effectsChain with the instrument's effectsChain
 * Handles added, removed, typeChanged, and orderChanged effects
 * @param {Object} instr - The instrument object
 * @param {number} ch - The channel/track number
 */
const syncEffectsChain = (instr, ch = 1) => changes$.next(engine => {
	const oldEffectsChain = engine[ch].effectsChain || [];
	const newEffectsChain = instr.effectsChain || [];
	
	// Convert old nodes to effect-like objects for comparison
	const oldEffects = oldEffectsChain.map(node => ({
		type: node.type,
		id: node.id,
		on: true // Assume all existing nodes are on for comparison
	}));
	
	// Get diff between old and new
	const diff = getEffectChainDiff(oldEffects, newEffectsChain);
	
	// Create a map of id -> node for old chain
	const oldNodeMap = {};
	oldEffectsChain.forEach(node => {
		if (node.id) oldNodeMap[node.id] = node;
	});
	
	// Build new effectsChain array matching newEffectsChain order
	const newChain = [];
	
	// Process each effect in the new chain
	newEffectsChain.forEach(effect => {
		if (!effect.id) return; // Skip effects without id
		
		const oldNode = oldNodeMap[effect.id];
		const effectKey = `${effect.type}:${effect.id}`;
		
		if (oldNode) {
			// Node exists - check if type changed
			if (oldNode.type !== effect.type) {
				// Type changed - destroy old, create new
				nodes.destroy(oldNode);
				const {type, on, expanded, id, ...effectProps} = effect;
				const newNode = nodes.create(type, effectProps, id);
				if (type === 'lfo') {
					a.start(newNode);
				}
				newChain.push(newNode);
			} else {
				// Same type - keep node (properties will be updated in updatePrefs)
				newChain.push(oldNode);
			}
		} else if (diff.added.includes(effectKey)) {
			// New effect - create node
			const {type, on, expanded, id, ...effectProps} = effect;
			const newNode = nodes.create(type, effectProps, id);
			if (type === 'lfo') {
				a.start(newNode);
			}
			newChain.push(newNode);
		} else {
			// Effect exists but wasn't in old chain (shouldn't happen, but handle gracefully)
			const {type, on, expanded, id, ...effectProps} = effect;
			const newNode = nodes.create(type, effectProps, id);
			if (type === 'lfo') {
				a.start(newNode);
			}
			newChain.push(newNode);
		}
	});
	
	// Destroy removed nodes
	diff.removed.forEach(effectKey => {
		const id = effectKey.split(':')[1];
		const oldNode = oldNodeMap[id];
		if (oldNode) {
			nodes.destroy(oldNode);
		}
	});
	
	return obj.patch(engine, ch, {
		effectsChain: newChain
	});
});

/**
 * Update the preferences for the instrument on the given channel/track
 * @param {Object} instr - The instrument object
 * @param {number} ch - The channel/track number
 */
const updatePrefs = (instr, ch = 1) => changes$.next(engine =>
	obj.patch(engine, ch,
		obj.map(engine[ch],
			(key, node) => {
				// Handle source properties (vco1, vco2, vca1, vca2)
				if (instr.source && (key === 'vco1' || key === 'vco2' || key === 'vca1' || key === 'vca2')) {
					const sourceProp = instr.source[key];
					if (sourceProp) {
						return a.update(node, sourceProp);
					}
				}
				// Handle effectsChain - update each node with matching effect config
				if (key === 'effectsChain') {
					return node.map(chainNode => {
						// Find matching effect in instrument effectsChain by id
						const effect = instr.effectsChain?.find(e => e.id === chainNode.id);
						if (effect) {
							// Update node with effect properties (excluding 'type', 'on', 'expanded', 'id')
							const {type, on, expanded, id, ...effectProps} = effect;
							return a.update(chainNode, effectProps);
						}
						return chainNode;
					});
				}
				// Handle voices
				if (key === 'voices') {
					return obj.map(node, (k, voice) => obj.map(voice, (voiceKey, n) => {
						// Update vco1, vco2, vca1, vca2 in voices
						if (instr.source && (voiceKey === 'vco1' || voiceKey === 'vco2')) {
							const sourceProp = instr.source[voiceKey];
							if (sourceProp) {
								return a.update(n, sourceProp);
							}
						}
						if (instr.source && (voiceKey === 'adsr1' || voiceKey === 'adsr2')) {
							// adsr1 maps to vca1, adsr2 maps to vca2
							const vcaKey = voiceKey === 'adsr1' ? 'vca1' : 'vca2';
							const sourceProp = instr.source[vcaKey];
							if (sourceProp) {
								return a.update(n, sourceProp);
							}
						}
						return n;
					}));
				}
				return node;
			}
		)
	)
);

/**
 * Update the connections for the instrument on the given channel/track
 * @param {Object} instr - The instrument object
 * @param {number} ch - The channel/track number
 */
const updateConnections = (instr, ch = 1) => changes$.next(engine => {
	// Get source properties
	const source = instr.source || {};
	const vco1On = source.vco1?.on ?? false;
	const vco2On = source.vco2?.on ?? false;
	
	// Get effectsChain from engine
	const effectsChain = engine[ch].effectsChain || [];
	
	// Build map of effect id -> node for quick lookup
	const effectNodeMap = {};
	effectsChain.forEach(node => {
		if (node.id) effectNodeMap[node.id] = node;
	});
	
	// Build audio routing chain: filter active effects (excluding LFO which modulates, doesn't route audio)
	const audioEffects = [];
	if (instr.effectsChain) {
		instr.effectsChain.forEach(effect => {
			if (effect.on && effect.type !== 'lfo' && effect.id) {
				const node = effectNodeMap[effect.id];
				if (node) {
					audioEffects.push(node);
				}
			}
		});
	}
	
	// Get first active effect node or volume
	const firstEffectNode = audioEffects.length > 0 ? audioEffects[0] : engine[ch].volume;
	
	// Disconnect all effects from each other and from volume
	// This ensures clean reconnection
	audioEffects.forEach(node => {
		a.disconnect(node);
	});
	
	// Build the audio chain: effect1 → effect2 → ... → volume → globalVolume
	// Connect effects in sequence
	if (audioEffects.length > 0) {
		// Chain effects together
		a.chain(...audioEffects);
		// Connect last effect to volume
		a.connect(audioEffects[audioEffects.length - 1], engine[ch].volume);
	}
	
	// Connect volume to globalVolume
	a.connect(engine[ch].volume, globalVolume);
	
	// Handle LFO modulation separately (LFO doesn't route audio)
	const lfoEffects = [];
	if (instr.effectsChain) {
		instr.effectsChain.forEach(effect => {
			if (effect.on && effect.type === 'lfo' && effect.id) {
				const node = effectNodeMap[effect.id];
				if (node) {
					lfoEffects.push({ node, effect });
				}
			}
		});
	}
	
	return obj.patch(engine, ch, {
		voices: obj.map(engine[ch].voices, (k, voice) => ({
			vco1: a.connect(voice.vco1, voice.adsr1),
			vco2: a.connect(voice.vco2, voice.adsr2),
			adsr1: (!vco1On)
				? a.disconnect(voice.adsr1)
				: a.reroute(voice.adsr1, firstEffectNode),
			adsr2: (!vco2On)
				? a.disconnect(voice.adsr2)
				: a.reroute(voice.adsr2, firstEffectNode)
		})),
		effectsChain: effectsChain, // Keep effectsChain as-is (connections handled above)
		volume: engine[ch].volume
	});
});

/**
 * Note on event handler
 * @param {Object} instr - The instrument object
 * @param {number} ch - The channel/track number
 * @param {string} note - The note to play
 * @param {number} velocity - The velocity of the note
 * @param {number} time - The time to play the note
 */
const noteOn = (instr, ch = 1, note, velocity, time, mute = false) => changes$.next(engine => {
	// get the engine state for the channel
	let {voices, effectsChain, volume, context} = engine[ch];
	time = time || context.currentTime;

	const freq = a.noteToFrequency(note);
	
	// Get source properties
	const source = instr.source || {};
	const vco1Config = source.vco1 || {};
	const vco2Config = source.vco2 || {};
	const vca1Config = source.vca1 || {};
	const vca2Config = source.vca2 || {};
	const vco1On = vco1Config.on ?? false;
	const vco2On = vco2Config.on ?? false;

	// Build map of effect id -> node
	const effectNodeMap = {};
	effectsChain.forEach(node => {
		if (node.id) effectNodeMap[node.id] = node;
	});
	
	// Get first active effect node (excluding LFO) or volume
	let firstEffectNode = volume;
	if (instr.effectsChain) {
		for (const effect of instr.effectsChain) {
			if (effect.on && effect.type !== 'lfo' && effect.id) {
				const node = effectNodeMap[effect.id];
				if (node) {
					firstEffectNode = node;
					break;
				}
			}
		}
	}

	let voice = voices[note] || false;

	if (voice.vco1 && buffer.indexOf(voice.vco1) > -1) {
		arr.remove(buffer, voice.vco1);
		a.stop(voice.vco1);
	}
	let vco1 = a.vco(Object.assign({}, vco1Config, {freq}));
	if (!mute) vco1 = a.start(vco1, time);
	let adsr1 = voice ? voice.adsr1 : a.adsr(vca1Config);
	vco1 = a.connect(vco1, adsr1);
	adsr1 = !vco1On
		? a.disconnect(adsr1)
		: a.reroute(adsr1, firstEffectNode);

	if (voice.vco2 && buffer.indexOf(voice.vco2) > -1) {
		arr.remove(buffer, voice.vco2);
		a.stop(voice.vco2);
	}
	let vco2 = a.vco(Object.assign({}, vco2Config, {freq}));
	if (!mute) vco2 = a.start(vco2, time);
	let adsr2 = voice ? voice.adsr2 : a.adsr(vca2Config);
	vco2 = a.connect(vco2, adsr2);
	adsr2 = !vco2On
		? a.disconnect(adsr2)
		: a.reroute(adsr2, firstEffectNode);

	// Handle LFO modulation - find all active LFO effects
	if (instr.effectsChain) {
		instr.effectsChain.forEach(effect => {
			if (effect.on && effect.type === 'lfo' && effect.id) {
				const lfoNode = effectNodeMap[effect.id];
				if (lfoNode) {
					const target = effect.target || 'volume';
					if (target === 'pitch') {
						if (lfoNode.output) {
							lfoNode.output.connect(vco1.output.detune);
							lfoNode.output.connect(vco2.output.detune);
						}
					} else {
						if (lfoNode.effect) {
							lfoNode.effect.connect(adsr1.through.gain);
							lfoNode.effect.connect(adsr2.through.gain);
						}
					}
				}
			}
		});
	}

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
		context});
});

/**
 * Note off event handler
 * @param {Object} instr - The instrument object
 * @param {number} ch - The channel/track number
 * @param {string} note - The note to stop
 * @param {number} time - The time to stop the note
 * @param {boolean} mute - Whether to mute the note
 */
const noteOff = (instr, ch = 1, note, time, mute = false) => changes$.next(engine => {
	const {voices, context} = engine[ch];
	const now = context.currentTime;
	time = time || now + 0.0001;
	
	// Get source properties
	const source = instr.source || {};
	const vca1Config = source.vca1 || {};
	const vca2Config = source.vca2 || {};
	const vca1Release = vca1Config.release > 0 ? vca1Config.release : 0.00001;
	const vca2Release = vca2Config.release > 0 ? vca2Config.release : 0.00001;

	let voice = voices[note] || false;

	if (voice) {
		let {vco1, adsr1, vco2, adsr2} = voice;

		if (!mute) {
			a.noteOff(adsr1, time);
			a.noteOff(adsr2, time);

			a.stop(vco1, time + vca1Release);
			a.stop(vco2, time + vca2Release);
		}
		setTimeout(() => {
			a.disconnect(vco1);
			a.disconnect(adsr1);
			a.disconnect(vco2);
			a.disconnect(adsr2);
		}, (time - now + vca1Release) * 1000);

		return obj.patch(engine, ch, {voices: obj.filter(voices, key => key !== note), context});
	}

	return engine;
});

const pitchBend = (instr, pitchValue, ch = 1) => changes$.next(engine => {
	// Get source properties
	const source = instr.source || {};
	const vco1Detune = source.vco1?.detune || 0;
	const vco2Detune = source.vco2?.detune || 0;
	
	return obj.patch(engine, [ch, 'voices'], obj.map(engine[ch].voices, (key, voice) => Object.assign({}, voice, {
		vco1: a.update(voice.vco1, {detune: vco1Detune + pitchValue * 200}),
		vco2: a.update(voice.vco2, {detune: vco2Detune + pitchValue * 200})
	})));
});

const sendMIDImsg = (device, note, velocity, delay = 0, channel = 1) => (
	// console.log(device, note, velocity, delay),
	device && device.send(
		[0x90 + (channel - 1), m.noteToNumber(note), `0x${parseInt(velocity * 127, 10).toString(16)}`],
		window.performance.now() + delay * 1000
	)
);

/**
 * The engine$ is a BehaviorSubject that emits the current engine state
 * It holds audio chains for different tracks starting with voices (containing the vcos and adsrs)
 * Next on the chain, depending on the instrument settings, the vcf, reverb, volume and lfo are added.
 */
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

	// sync effects chain when instrument effectsChain changes
	state$.pipe(
		distinctUntilChanged((prev, curr) => {
			const prevChains = prev.session.tracks.map(track => 
				track.inst?.effectsChain ? track.inst.effectsChain.map(e => `${e.type}:${e.id}`).join(',') : ''
			);
			const currChains = curr.session.tracks.map(track => 
				track.inst?.effectsChain ? track.inst.effectsChain.map(e => `${e.type}:${e.id}`).join(',') : ''
			);
			return JSON.stringify(prevChains) === JSON.stringify(currChains);
		})
	).subscribe(({instrument, session}) => session.tracks.forEach(
		(track, ch) => ch > 0 && track.inst && syncEffectsChain(track.inst, ch))
	);

	// update connections
	state$.pipe(
		distinctUntilChanged((prev, curr) => {
			const prevTracks = prev.session.tracks.map((track, ch) => {
				if (ch === 0 || !track.inst) return null;
				const source = track.inst.source || {};
				const effectsChain = track.inst.effectsChain || [];
				return [
					source.vco1?.on,
					source.vco2?.on,
					...effectsChain.map(e => ({type: e.type, on: e.on}))
				];
			});
			const currTracks = curr.session.tracks.map((track, ch) => {
				if (ch === 0 || !track.inst) return null;
				const source = track.inst.source || {};
				const effectsChain = track.inst.effectsChain || [];
				return [
					source.vco1?.on,
					source.vco2?.on,
					...effectsChain.map(e => ({type: e.type, on: e.on}))
				];
			});
			return JSON.stringify(prevTracks) === JSON.stringify(currTracks);
		})
	).subscribe(({instrument, session}) => session.tracks.forEach(
		(track, ch) => ch > 0 && track.inst && updateConnections(track.inst, ch))
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
			syncEffectsChain(track.inst, ch),
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
