'use strict';

const moment = require('moment');

const {div, h1, header, img, i, ul, li, a, button, input} = require('iblokz-snabbdom-helpers');

const fileUtil = require('../../util/file');

const openDialog = cb => {
	let fileEl = document.createElement('input');
	fileEl.setAttribute('type', 'file');
	fileEl.addEventListener('change', ev => {
		console.log(ev.target.files, this);
		cb(
			ev.target.files
		);
	});
	fileEl.dispatchEvent(new MouseEvent('click', {
		view: window,
		bubbles: true,
		cancelable: true
	}));
};

module.exports = ({state, actions}) => header([
	ul([
		li([a({
			class: {on: state.ui.mediaLibrary},
			on: {click: ev => actions.toggleUI('mediaLibrary')}
		}, [i('.fa.fa-book')])]),
		// li([a({class: {on: state.ui.patches}, on: {click: ev => actions.toggleUI('patches')}}, 'Patches')]),
		li([a({
			class: {on: state.ui.instrument},
			on: {click: ev => actions.toggleUI('instrument')}
		}, [i('.fa.fa-tasks')])]),
		li([a({class: {on: state.ui.sequencer}, on: {click: ev => actions.toggleUI('sequencer')}}, [i('.fa.fa-braille')])]),
		li([a({class: {on: state.ui.midiMap}, on: {click: ev => actions.toggleUI('midiMap')}}, [i('.fa.fa-sitemap')])]),
		li([a({
			class: {on: state.ui.midiKeyboard},
			on: {click: ev => actions.toggleUI('midiKeyboard')}}, [i('.fa.fa-keyboard-o')])])
	]),
	h1([
		img('[src="assets/logo2.png"]')
	]),
	ul('.right', [
		li([
			input('[type="range"]', {
				attrs: {min: 0, max: 1, step: 0.005},
				props: {value: state.studio.volume},
				on: {change: ev => actions.studio.change('volume', parseFloat(ev.target.value))}
			})
		]),
		li([a('[title="New"]', {
			on: {click: () => actions.clear()}
		}, [i('.fa.fa-file-o')])]),
		li([a('[title="Save"]', {
			on: {
				click: ev => fileUtil.save(moment().format('YYYY-MM-DD-hh-mm[-jam.json]'), state)
			}
		}, [i('.fa.fa-save')])]),
		li([a('[title="Load"]', {
			on: {
				click: ev => openDialog(files =>
					fileUtil.load(files[0], 'json').subscribe(content => actions.load(content))
				)
			}
		}, [i('.fa.fa-upload')])])
	])
]);
