'use strict';

const {obj, fn} = require('iblokz-data');
const {context, create: _create, set, chain, duration, chData} = require('../core');
// const {context} = core;

const buildImpulse = ({seconds, decay}) => {
	let impulse = _create('buffer', 2, duration(seconds), context.sampleRate);
	let channelData = [
		chData(impulse, 0),
		chData(impulse, 1)
	];
	for (let i = 0; i < duration(seconds); i++) {
		channelData[0][i] = (Math.random() * 2 - 1) * Math.pow(1 - i / duration(seconds), decay);
		channelData[1][i] = (Math.random() * 2 - 1) * Math.pow(1 - i / duration(seconds), decay);
	}
	return impulse;
};

const create = prefs => [{
	prefs: Object.assign({seconds: 3, decay: 2, wet: 0, dry: 1}, prefs),
	input: _create('gain'),
	output: _create('gain'),
	effect: _create('convolver'),
	wet: _create('gain'),
	dry: _create('gain')
}].map(n => (
	chain(n.input, n.dry, n.output),
	chain(n.input, n.effect, n.wet, n.output),
	set(n.dry.gain, 'value', n.prefs.dry),
	set(n.wet.gain, 'value', n.prefs.wet),
	set(n.effect, 'buffer', buildImpulse(n.prefs)),
	n
)
	// n

	/*
	n.input.connect(n.effect);
	n.effect.connect(n.wet);
	n.wet.connect(n.output);

	n.input.connect(n.dry);
	n.dry.connect(n.output);
	*/
	/*
	n.dry.gain.value = n.prefs.dry;
	n.wet.gain.value = n.prefs.wet;
	n.effect.buffer = buildImpulse(n.prefs);
	*/
	// set(n.wet.gain, 'value', n.prefs.wet),
	// set(n.effect, 'buffer', buildImpulse(n.prefs)),
	// return n;
).pop();

const update = (n, prefs) => (
//	console.log(prefs, n.prefs),
	(n.prefs.seconds !== prefs.seconds || n.prefs.decay !== prefs.decay)
		&& set(n.effect, 'buffer', buildImpulse(n.prefs)),
	(n.prefs.dry !== prefs.dry)
		&& set(n.dry.gain, 'value', prefs.dry),
	(n.prefs.wet !== prefs.wet)
		&& set(n.wet.gain, 'value', prefs.wet),
	set(n, 'prefs', Object.assign({}, n.prefs, prefs)),
	n
);

module.exports = {
	create,
	update
};
