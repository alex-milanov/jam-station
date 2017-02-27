'use strict';

const {
	div, h2, span, p, ul, li, hr, button,
	fieldset, legend, i, input, label
} = require('iblokz-snabbdom-helpers');

const {obj, str} = require('iblokz-data');

const indexAt = (collection, prop, value) =>
	collection.reduce((index, doc, i) => doc[prop] === value ? i : index, -1);

/*
const groupList = list => list.reduce((groups, name) =>
	[str.toCamelCase(name.replace(/[0-9]+/ig, '').replace('.ogg', ''))]
		.map(group => ({group, index: indexAt(groups, 'name', group)}))
		.map(({group, index}) =>
		(index > -1)
			? [].concat(
				groups.slice(0, index),
				[{
					name: group,
					items: groups[index].items.concat([name])
				}],
				groups.slice(index + 1)
			)
			: groups.concat([{
				name: group,
				items: [name]
			}])
	).pop(), []
);
*/

// console.log(groupList([
// 	'kick01.ogg',
// 	'kick02.ogg',
// 	'kick03.ogg',
// 	'kick_hiphop01.ogg',
// 	'hihat_opened02.ogg',
// 	'hihat_opened03.ogg',
// 	'ride02.ogg',
// 	'rim01.ogg']));

const parseTree = (items, state, actions, level = 0) => ul(items.map((item, k) =>
	(typeof item === 'object')
		? li('[draggable="true"]', [
			input(`[type="checkbox"][id="li-${level}-${k}-${item.name}"]`, {
				attrs: {checked: item.expanded}
			}),
			label(`[for="li-${level}-${k}-${item.name}"]`, {style: {paddingLeft: (5 + level * 5) + 'px'}}, [
				i('.fa.fa-folder-o'),
				' ',
				item.name
			])
		].concat(
			item.items ? parseTree(item.items, state, actions, level + 1) : []
		))
		: li('[draggable="true"]', {
			on: {dblclick: () => actions.sequencer.setSample(
				state.sequencer.channel,
				state.mediaLibrary.files.indexOf(item)
			)}
		}, [
			label({
				style: {paddingLeft: (5 + level * 5) + 'px'}
			}, [
				i('.fa.fa-file-audio-o'),
				' ',
				item
			]),
			button('.right.fa.fa-play')
		])
));

module.exports = ({state, actions}) => div('.media-library', [
	div('.header', [
		h2([i('.fa.fa-book'), ' Media Library'])
	]),
	div('.body', [
		fieldset([
			legend('Samples'),
			parseTree(state.mediaLibrary.samples, state, actions)
		]),
		fieldset([
			legend('Instruments'),
			ul([li([label('BasicSynth')])])
		])
	])
]);
