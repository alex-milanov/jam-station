'use strict';

const {
	div, h2, span, p, ul, li, hr, button,
	fieldset, legend, i
} = require('iblokz/adapters/vdom');

const obj = require('iblokz/common/obj');
const str = require('iblokz/common/str');

const indexAt = (collection, prop, value) =>
	collection.reduce((index, doc, i) => doc[prop] === value ? i : index, -1);

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

// console.log(groupList([
// 	'kick01.ogg',
// 	'kick02.ogg',
// 	'kick03.ogg',
// 	'kick_hiphop01.ogg',
// 	'hihat_opened02.ogg',
// 	'hihat_opened03.ogg',
// 	'ride02.ogg',
// 	'rim01.ogg']));

module.exports = ({state, actions}) => div('.media-library', [
	div('.header', [
		h2('Media Library')
	]),
	div('.body', [
		fieldset([
			legend('Samples'),
			ul(groupList(state.mediaLibrary.samples).map((group, k) =>
				li({
					class: {expanded: state.mediaLibrary.expanded.indexOf(group.name) > -1}
				}, [
					span({
						on: {click: () => actions.mediaLibrary.expand(group.name)}
					}, [
						i((state.mediaLibrary.expanded.indexOf(group.name) > -1)
							? '.fa.fa-minus-square-o' : '.fa.fa-plus-square-o'),
						' ',
						group.name
					]),
					ul(group.items.map((sample, i) =>
						li({
							on: {click: () => actions.sequencer.setSample(
								state.sequencer.channel,
								state.mediaLibrary.samples.indexOf(sample)
							)}
						}, [
							span(sample),
							button('.right.fa.fa-play')
						])
					))
				])
			))
		]),
		fieldset([
			legend('Instruments'),
			ul([li('BasicSynth')])
		])
	])
]);
