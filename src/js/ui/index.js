'use strict';

const {div, p, button, a} = require('iblokz-snabbdom-helpers');
const header = require('./header');
const mediaLibrary = require('./media-library');
const instrument = require('./instrument');
const session = require('./session');
const sequencer = require('./sequencer');
const midiMap = require('./midi-map');
const midiKeyboard = require('./midi-keyboard');
const pianoRoll = require('./piano-roll');

const panels = {
	mediaLibrary,
	instrument,
	session,
	sequencer,
	midiMap,
	midiKeyboard,
	pianoRoll
};

module.exports = ({state, actions, tapTempo, context}) => div('#ui',
	context.state === 'suspended'
	? div([
		p('Due to policy changes in Google Chrome you have to click Resume to use WebAudio'),
		p('Note: You will only see this message if your web audio\'s state is suspended'),
		p(['More info at: ',
			a('[href="https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio"]',
			'google autoplay policy changes')]),
		button({on: {
			click: ev => context.resume().then(() => actions.ping())
		}}, 'Resume')
	])
	: [
		header({state, actions, tapTempo}),
		div('#layout', Object.keys(panels)
			.filter(panel => state.layout[panel].visible)
			.map(panel =>
				panels[panel]({state, actions, params: {
				}})
			))
	]
);
