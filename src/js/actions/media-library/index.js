'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {obj, arr} = require('iblokz-data');
const {measureToBeatLength} = require('../../util/math');

const stream = new Subject();

const initial = {
	files: [
		'kick01.ogg',
		'kick02.ogg',
		'kick03.ogg',
		'kick_hiphop01.ogg',
		'hihat_opened02.ogg',
		'hihat_opened03.ogg',
		'ride02.ogg',
		'rim01.ogg',
		'snare01.ogg',
		'snare02.ogg',
		'snare03.ogg',
		'snare04.ogg',
		'snare05.ogg',
		'clap01.ogg',
		'clap02.ogg',
		'clap03.ogg',
		'clap04.ogg',
		'shaker01.ogg',
		'shaker02.ogg'
	],
	samples: [{
		name: 'original bank(will be replaced soon)',
		expanded: true,
		items: [
			{
				name: 'kick',
				items: [
					'kick01.ogg',
					'kick02.ogg',
					'kick03.ogg',
					'kick_hiphop01.ogg'
				]
			},
			{
				name: 'hihat',
				items: [
					'hihat_opened02.ogg',
					'hihat_opened03.ogg'
				]
			},
			{
				name: 'snare',
				items: [
					'snare01.ogg',
					'snare02.ogg',
					'snare03.ogg',
					'snare04.ogg',
					'snare05.ogg'
				]
			},
			{
				name: 'clap',
				items: [
					'clap01.ogg',
					'clap02.ogg',
					'clap03.ogg',
					'clap04.ogg'
				]
			},
			{
				name: 'shaker',
				items: [
					'shaker01.ogg',
					'shaker02.ogg'
				]
			},
			'ride02.ogg',
			'rim01.ogg'
		]},
		{
			name: 'custom',
			items: [
			]
		}
	],
	patches: [{
		name: 'default',
		patch: {
			vcaOn: 0,
			vca1: {
				volume: 0.41,
				attack: 0.31,
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
			lfo: {
				on: false,
				type: 'sawtooth',
				frequency: 5,
				gain: 0.15
			},
			vcf: {
				on: true,
				cutoff: 0.64,
				resonance: 0,
				gain: 0
			}
		}
	}, {
		name: 'fantasy bells',
		patch: {
			vcaOn: 1,
			vca1: {
				volume: 0.21,
				attack: 0,
				decay: 0.16,
				sustain: 0.8,
				release: 0.52
			},
			vca2: {
				volume: 0.17,
				attack: 0,
				decay: 0.16,
				sustain: 0.8,
				release: 0.55
			},
			vco1: {
				on: true,
				type: 'sawtooth',
				detune: -5
			},
			vco2: {
				on: true,
				type: 'sine',
				detune: 8
			},
			vcf: {
				on: true,
				cutoff: 0.57,
				resonance: 0.37,
				gain: 0
			}
		}
	}, {
		name: 'accordeon',
		patch: {
			vcaOn: 0,
			vca1: {
				volume: 0.14,
				attack: 0.19,
				decay: 0.55,
				sustain: 0.5,
				release: 0.43
			},
			vca2: {
				volume: 0.21,
				attack: 0.16,
				decay: 0.17,
				sustain: 0.47,
				release: 0.38
			},
			vco1: {
				on: true,
				type: 'square',
				detune: -3
			},
			vco2: {
				on: true,
				type: 'sawtooth',
				detune: 3
			},
			lfo: {
				on: false,
				type: 'sawtooth',
				frequency: 5,
				gain: 0.15
			},
			vcf: {
				on: true,
				cutoff: 0.51,
				resonance: 0.14,
				gain: 0
			}
		}
	}]
};

const indexAt = (list, prop, value) =>
	list.reduce((at, item, index) => item[prop] === value ? index : at, -1);

const treePatch = (nodes, path, item) => (
	// console.log(nodes, path, item),
	(path.length === 1 && path[0] === item)
		? [].concat(nodes, [item])
		: [indexAt(nodes, 'name', path[0])].map(index =>
				[{
					name: path[0],
					items: (path.length > 2)
						? treePatch((index > -1) ? nodes[index].items : [], path.slice(1), item)
						: [].concat((index > -1) ? nodes[index].items : [], [item])
				}].map(patch =>
					(index > -1)
						? [].concat(nodes.slice(0, index), [patch], nodes.slice(index + 1))
						: [].concat(nodes, [patch])
			).pop()
		).pop());

const loadSamples = list => stream.onNext(state => obj.patch(state, 'mediaLibrary', {
	files: [].concat(state.mediaLibrary.files, list.map(item => item.split('/').pop())),
	samples: [].concat(state.mediaLibrary.samples, list.reduce(
		(tree, item) => treePatch(tree, item.split('/'), item.split('/').pop()),
		[])
	)
}));

const addSample = (sample, bank = 'custom') => stream.onNext(state =>
	obj.patch(state, 'mediaLibrary', [indexAt(state.mediaLibrary.samples, 'name', bank)].map(index => ({
		samples: [].concat(
			state.mediaLibrary.samples.slice(0, index),
			obj.patch(state.mediaLibrary.samples[index], {
				index: arr.add(state.mediaLibrary.samples[index].items, sample)
			}),
			state.mediaLibrary.samples.slice(index + 1)
		)
	})).pop())
);

const addPatch = (name, patch) => stream.onNext(state =>
	obj.patch(state, 'mediaLibrary', {
		patches: arr.add(state.mediaLibrary.patches, {
			name,
			patch
		})
	})
);

module.exports = {
	stream,
	initial,
	loadSamples,
	addSample,
	addPatch
};
