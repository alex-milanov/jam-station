'use strict';

const {obj, fn} = require('iblokz-data');

const context = new (
	window.AudioContext
	|| window.webkitAudioContext
	|| window.mozAudioContext
	|| window.oAudioContext
	|| window.msAudioContext
)();

const set = (o, k, v) => (o[k] = v);
const isSet = v => v !== undefined;
const isGet = v => isSet(v) ? v : null;

const apply = (o1, o2) => Object.keys(o2)
	.reduce((o, k) => set(o, k, o2[k]), o1);

const create = (type, ...args) => (
	// console.log(type),
	obj.switch(type, {
		oscillator: () => context.createOscillator(...args),
		gain: () => context.createGain(...args),
		biquadFilter: () => context.createBiquadFilter(...args),
		convolver: () => context.createConvolver(...args),
		buffer: () => context.createBuffer(...args),
		bufferSource: () => context.createBufferSource(...args)
	})());

const update = (node, prefs) => apply(node, prefs);

const connect = (n1, n2) => (
	// console.log(n1, n2),
	n1.connect(n2),
	n1
);
const disconnect = (n1, n2) => {
	// since there is no way to determine if they are connected
	try {
		n1.disconnect(n2);
	} catch (err) {
		console.log(err);
	}
	return n1;
};

const chain = (...nodes) => (
	nodes.forEach((n, i) => isSet(nodes[i + 1]) && connect(n, nodes[i + 1])),
	nodes[0]
);

const unchain = (...nodes) => (
	nodes.slice().reverse()
		.forEach((n, i) => isSet(nodes[i - 1]) && disconnect(nodes[i - 1], n)),
	nodes[0]
);

const duration = seconds => context.sampleRate * seconds;
const chData = (node, ...args) => (
	// console.log(node, args),
	node.getChannelData(...args)
);

const schedule = (node, pref, values, times) => (values.length === 1)
	? node[pref].setValueAtTime(values[0], times[0])
	: (node[pref].setValueCurveAtTime(new Float32Array(values.slice(0, 2)), times[0], times[1]),
		(values.length > 2) && schedule(node, pref, values.slice(1), [times[0] + times[1]].concat(times.slice(2))));

module.exports = {
	context,
	set,
	isSet,
	isGet,
	create,
	update,
	connect,
	disconnect,
	chain,
	unchain,
	// util
	duration,
	chData,
	schedule
};
