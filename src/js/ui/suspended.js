'use strict';

const {
	div, p, h1, header, img, i, ul, li,
	a, button, input, label, span
} = require('iblokz-snabbdom-helpers');

const {context} = require('../util/audio');

module.exports = ({state, actions}) => div([
	p('Due to policy changes in Google Chrome you have to click Resume to use WebAudio'),
	p('Note: You will only see this message if your web audio\'s state is suspended'),
	p(['More info at: ',
		a('[href="https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio"]',
		'google autoplay policy changes')]),
	button({on: {
		click: ev => context.resume().then(() => actions.ping())
	}}, 'Resume')
]);
