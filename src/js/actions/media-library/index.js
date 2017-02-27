'use strict';
const Rx = require('rx');
const $ = Rx.Observable;
const {Subject} = Rx;

// util
const {obj} = require('iblokz-data');
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
		]}
	]
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

module.exports = {
	stream,
	initial,
	loadSamples
};
