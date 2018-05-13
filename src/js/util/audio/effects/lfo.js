'use strict';

const {obj, fn} = require('iblokz-data');
const {context, create: _create, set, chain, duration, chData} = require('../core');

const create = prefs => [{
	prefs: Object.assign({
		type: 'sawtooth',
		frequency: 5,
		gain: 15
	}, prefs),
	effect: _create('oscillator'),
	output: _create('gain')
}].map(n => (
	chain(n.effect, n.output),
	set(n.effect.frequency, 'value', n.prefs.frequency),
	set(n.output.gain, 'value', n.prefs.gain),
	set(n.effect, 'type', n.prefs.type),
	n
)).pop();

const update = (n, prefs) => (
	set(n, 'prefs', Object.assign({}, n.prefs, prefs)),
	set(n.effect.frequency, 'value', n.prefs.frequency),
	set(n.output.gain, 'value', n.prefs.gain),
	set(n.effect, 'type', n.prefs.type),
	n
);

const start = (n, ...args) => (
	n.effect.start(),
	n
);

// const clone = n => create(null, n.output.buffer);

module.exports = {
	create,
	update,
	start
};
