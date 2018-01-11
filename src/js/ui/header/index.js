'use strict';

const moment = require('moment');

const {div, h1, header, img, i, ul, li, a, button, input, label} = require('iblokz-snabbdom-helpers');

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

module.exports = ({state, actions, tapTempo}) => header([
	ul([
		li([a({
			class: {on: state.layout.mediaLibrary.visible},
			on: {click: ev => actions.toggle(['layout', 'mediaLibrary', 'visible'])}
		}, [i('.fa.fa-book')])]),
		// li([a({class: {on: state.ui.patches}, on: {click: ev => actions.toggleUI('patches')}}, 'Patches')]),
		li([a({
			class: {on: state.layout.instrument.visible},
			on: {click: ev => actions.toggle(['layout', 'instrument', 'visible'])}
		}, [i('.fa.fa-sliders')])]),
		li([a({
			class: {on: state.layout.sequencer.visible},
			on: {click: ev => actions.toggle(['layout', 'sequencer', 'visible'])}
		}, [i('.fa.fa-braille')])]),
		li([a({
			class: {on: state.layout.pianoRoll.visible},
			on: {click: ev => actions.toggle(['layout', 'pianoRoll', 'visible'])}
		}, [
			img('[src="/assets/piano-roll.svg"][height="34px"]')
		])]),
		li([a({
			class: {on: state.layout.midiKeyboard.visible},
			on: {click: ev => actions.toggle(['layout', 'midiKeyboard', 'visible'])}}, [
				img('[src="/assets/midi-keyboard.svg"]')
			])]),
		li([a({
			class: {on: state.layout.midiMap.visible},
			on: {click: ev => actions.toggle(['layout', 'midiMap', 'visible'])}
		}, [
			img('[src="/assets/midi.svg"][height="38px"]')
		])])
	]),
	ul('.center', [
		li([img('[src="assets/logo2.png"]')]),
		li('.right', [
			label({
				on: {
					click: () => tapTempo.tap()
				}
			}, 'BPM'),
			input('.bpm', {
				props: {value: state.studio.bpm || 120, size: 3},
				on: {input: ev => actions.studio.change('bpm', ev.target.value)}
			}),
			label('LN'),
			input('.bars-length', {
				props: {value: state.studio.barsLength || 4, size: 3},
				on: {input: ev => actions.studio.change('barsLength', ev.target.value)}
			}),
			label('SIG'),
			input('.measure', {
				props: {value: state.studio.measure || '4/4', size: 6},
				on: {input: ev => actions.studio.change('measure', ev.target.value)}
			})
		])
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
