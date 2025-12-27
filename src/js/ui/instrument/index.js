'use strict';

const {
	div, h2, h3, span, p, ul, li, hr, button, br,
	form, label, input, fieldset, legend, i, img
} = require('iblokz-snabbdom-helpers');

const {obj} = require('iblokz-data');

const Sortable = require('sortablejs').default;

// vex dialog
const vex = require('vex-js');
const prompt = (message, cb) => vex.dialog.prompt({
	message,
	callback: v => v && v !== '' && cb(v)
});

const vco = require('./vco').default;
const vca = require('./vca').default;
const vcf = require('./vcf');
const lfo = require('./lfo');
const reverb = require('./reverb');
const delay = require('./delay');
const sampler = require('./sampler').default || require('./sampler');

const vcas = ['vca1', 'vca2'];

const synth = ({state, actions}) => [
	vco({name: 'vco1', prefs: state.instrument.source.vco1,
		updateProp: (prop, value) => actions.set(['instrument','source','vco1', prop], value)}),
	vco({name: 'vco2', prefs: state.instrument.source.vco2,
		updateProp: (prop, value) => actions.set(['instrument','source','vco2', prop], value)}),
	fieldset([].concat(
		// vca tabs selector
		legend(vcas.map((name, i) =>
			span({
				class: {on: state.instrument.source.vcaOn === i + 1},
				on: {click: () => actions.set(['instrument', 'source', 'vcaOn'], i + 1)}
			}, name.toUpperCase())
		)),
		// active vca
		vca({prefs: state.instrument.source[`vca${state.instrument.source.vcaOn}`],
			updateProp: (prop, value) =>
				actions.set(['instrument','source', `vca${state.instrument.source.vcaOn}`, prop], value)})
	)),
];

module.exports = ({state, actions, params = {}}) => div('.instrument', params, [
	div('.header', [
		h2([i('.fa.fa-sliders'), ' Instrument [', state.session.selection.instr.join(':'), ']']),
		div('.right', [
			button('.fa.fa-eraser', {on: {
				click: () => actions.instrument.applyPatch(
					state.mediaLibrary.patches.filter(p => p.name === 'default').pop().patch
				)
			}}),
			button('.fa.fa-save', {on: {click: () => prompt('Save patch as',
				name => actions.mediaLibrary.addPatch(name, state.instrument))}})
		])
	]),
	div('.body', [
		// source
		form({on: {submit: ev => ev.preventDefault()}}, [].concat(
			h3('Source'),
			obj.switch(state.instrument.sourceType, {
				synth,
				sampler,
				default: () => []
			})({state, actions})
		)),
		// effects chain
		form({on: {submit: ev => ev.preventDefault()},
			hook: {
				insert: vnode => (
					new Sortable(vnode.elm, {
						group: 'effects-chain',
						draggable: 'fieldset',
						handle: "legend",
						dataIdAttr: 'data-id',
						onEnd: (event) => {
							const fromIndex = event.oldIndex - 1;
							const toIndex = event.newIndex - 1;
							console.log('onEnd', fromIndex, toIndex);
							actions.instrument.reorderEffect(fromIndex, toIndex);
						}
					})
				)
			}
		}, [].concat(
			h3('Effects'),
			...(state.instrument.effectsChain || []).map((effect, index) => obj.switch(effect.type, {
				vcf, lfo, reverb, delay, // pick the right component based on the effect type
				default: () => ''
			}) // pass the effect object to the component
			({
				effect, index,
				updateProp: (prop, value) => actions.instrument.updateProp(index, prop, value),
				toggleExpanded: () => actions.instrument.toggleExpanded(index)
			})),
			button({on: {click: () => actions.instrument.addEffect('vcf')}},
				[i('.fa.fa-plus'), ' Add Effect'])
		))
	])
]);
