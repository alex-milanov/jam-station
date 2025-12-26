import {obj, arr} from 'iblokz-data';

import {v4 as uuidv4} from 'uuid';


// Synth source prefs & audio node chains
export const synthSource = {
	vco1: {
		on: true,
		type: 'square',
		detune: -1
	},
	vco2: {
		on: true,
		type: 'sawtooth',
		detune: 1
	},
	vcaOn: 1,
	vca1: {
		volume: 0.41,
		attack: 0,
		decay: 0.16,
		sustain: 0.8,
		release: 0.21
	},
	vca2: {
		volume: 0.43,
		attack: 0,
		decay: 0.16,
		sustain: 0.8,
		release: 0.19
	},
	chains: [
		['vco1', 'vca1'],
		['vco2', 'vca2']
	]
}

// Sampler source prefs & audio node chains
export const samplerSource = {
	sampler: {
		file: 'assets/samples/kick.wav',
		playing: false
	},
	vca: {
		volume: 0.4,
		attack: 0,
		decay: 0.16,
		sustain: 0.8,
		release: 0.21
	},
	chains: [
		['sampler', 'vca'],
	]
}

export const defaultEffectConfigs = {
	vcf: {type: 'vcf', on: true, expanded: true, cutoff: 0.64, resonance: 0, gain: 0},
	reverb: {type: 'reverb', on: true, expanded: true, seconds: 3, decay: 2, reverse: false, dry: 0.8, wet: 0.7},
	lfo: {type: 'lfo', on: false, expanded: false, lfoType: 'sawtooth', frequency: 5, gain: 0.15},
	delay: {type: 'delay', on: false, expanded: false, time: 1, dry: 1, wet: 0}
}

export const initial = {
	sourceType: 'synth', // 'synth' or 'sampler'
	// synth source prefs by default
	source: synthSource,
	// effects chain
	effectsChain: Object.values(defaultEffectConfigs).slice(0, 3)
		.map(effect => ({...effect, id: uuidv4()})),
};

/**
 * Immutably reorders an array by moving an item from one index to another.
 * @param {Array} arr - The source array
 * @param {number} from - The index of the item to move
 * @param {number} to - The index to move the item to
 * @returns {Array} A new array with the item moved
 * @example
 * reorder(['a', 'b', 'c', 'd', 'e'], 2, 1) // => ['a', 'c', 'b', 'd', 'e']
 * reorder(['a', 'b', 'c', 'd', 'e'], 1, 3) // => ['a', 'd', 'c', 'b', 'e']
 * reorder(['a', 'b', 'c', 'd', 'e'], 3, 3) // => ['a', 'b', 'c', 'd', 'e']
 */
const reorder = (arr, from, to) => from === to ? arr : from > to
	? [].concat(arr.slice(0, to), [arr[from]], arr.slice(to + 1, from), [arr[to]], arr.slice(from + 1))
	: [].concat(arr.slice(0, from), [arr[to]], arr.slice(from + 1, to), [arr[from]], arr.slice(to + 1));

const updateProp = (index, prop, value) =>
	state => obj.patch(state, ['instrument'], {
		...state.instrument,
		effectsChain: state.instrument.effectsChain.map((effect, i) =>
			i === index ? Object.assign({}, effect, {[prop]: value}) : effect
		)
	});

const toggleExpanded = (index) =>
	state => obj.patch(state, ['instrument'], {
		...state.instrument,
		effectsChain: state.instrument.effectsChain.map((effect, i) =>
			i === index ? Object.assign({}, effect, {expanded: !effect.expanded}) : effect
		)
	});

const setVca = index =>
	state => obj.patch(state, ['instrument', 'vcaOn'], index);

const applyPatch = patch =>
	state => obj.patch(state, 'instrument', patch);

// Effects chain actions
const addEffect = (type, config = {}) => state => 
	obj.patch(state, ['instrument', 'effectsChain'], [].concat(
		state.instrument.effectsChain,
		[{...(defaultEffectConfigs[type] || {}), ...config, id: uuidv4()}])
	);

const removeEffect = index => state =>
	obj.patch(state, ['instrument', 'effectsChain'],
		state.instrument.effectsChain.filter((_, i) => i !== index)
	);

const reorderEffect = (fromIndex, toIndex) => state => 
	obj.patch(state, ['instrument', 'effectsChain'],
		reorder(state.instrument.effectsChain, fromIndex, toIndex)
	);

const updateEffect = (index, updates) => state =>
	obj.patch(state, ['instrument', 'effectsChain', index], {
		...state.instrument.effectsChain[index],
		...updates
	});

export default {
	initial,
	updateProp,
	toggleExpanded,
	setVca,
	applyPatch,
	addEffect,
	removeEffect,
	reorderEffect,
	updateEffect
};
