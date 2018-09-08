'use strict';

const {obj, fn} = require('iblokz-data');
const {context, create: _create, set, chain, duration, chData, schedule} = require('../core');

const create = prefs => [{
	prefs: Object.assign({
		volume: 0.41,
		attack: 0.31,
		decay: 0.16,
		sustain: 0.8,
		release: 0.21
	}, prefs),
	through: _create('gain')
}].map(n => (
	set(n.through.gain, 'value', 0),
	n
)).pop();

const update = (n, prefs) => (
	set(n, 'prefs', Object.assign({}, n.prefs, prefs)),
	n
);

const noteOn = (node, velocity, time) => {
	const now = context.currentTime;
	time = (time || now) + 0.0001;

	node.through.gain.cancelScheduledValues(0);

	const changes = [].concat(
		// attack
		(node.prefs.attack > 0)
			? [[0, time], [velocity * node.prefs.volume, node.prefs.attack]]
			: [[velocity * node.prefs.volume, time]],
		// decay
		(node.prefs.decay > 0)
			? [[node.prefs.sustain * velocity * node.prefs.volume, node.prefs.decay]] : []
	).reduce((a, c) => [[].concat(a[0], c[0]), [].concat(a[1], c[1])], [[], []]);

	schedule(node.through, 'gain', changes[0], changes[1]);
	return node;
};

const noteOff = (node, time) => {
	const now = context.currentTime;
	time = time || now + 0.0001;

	setTimeout(() => (
		node.through.gain.cancelScheduledValues(0),
		node.through.gain.setValueCurveAtTime(new Float32Array([node.through.gain.value, 0]),
				time, node.prefs.release > 0 && node.prefs.release || 0.00001)
	), (time - now) * 1000);
	return node;
};

module.exports = {
	create,
	update,
	noteOn,
	noteOff
};
