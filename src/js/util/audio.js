'use strict';

const arr = require('iblokz/common/arr');
const obj = require('iblokz/common/obj');

const prefsMap = {
	vco: {
		freq: 'frequency',
		type: 'type',
		detune: 'detune'
	},
	vcf: {
		type: 'type',
		cutoff: 'frequency',
		resonance: 'Q'
	},
	vca: {
		gain: 'gain'
	}
};

let context = new (
	window.AudioContext
	|| window.webkitAudioContext
	|| window.mozAudioContext
	|| window.oAudioContext
	|| window.msAudioContext
)();

const create = (type, context) => ({
	type,
	node: {
		vco: () => context.createOscillator(),
		lfo: () => context.createOscillator(),
		vca: () => context.createGain(),
		vcf: () => context.createBiquadFilter()
	}[type]()
});

const connect = (node1, node2) => (
	((node1.node && node1.node.connect)
		? node1.node
		: node1).connect(
		node2.node || node2
	), node1
);

const chain = nodes => nodes.forEach(
	(node, i) => {
		if (nodes[i + 1]) connect(node, nodes[i + 1]);
	}
);

const apply = (node, prefs) => Object.keys(prefs)
	.filter(pref => prefsMap[node.type][pref] !== undefined)
	.map(pref => (console.log('pref', node, pref), pref))
	.reduce(
		(node, pref) => {
			if (pref === 'type') {
				node.node[prefsMap[node.type][pref]] = prefs[pref];
			} else {
				node.node[prefsMap[node.type][pref]].value = prefs[pref];
			}
			return node;
		},
		node
	);

const add = (type, prefs, context) => apply(create(type, context), prefs);

const start = function(node) {
	node.node.start.apply(node.node, Array.from(arguments).slice(1));
	return node;
};

const stop = function(node) {
	node.node.stop.apply(node.node, Array.from(arguments).slice(1));
	return node;
};

module.exports = {
	context,
	create,
	connect,
	chain,
	apply,
	add,
	start,
	stop,
	vco: prefs => apply(create('vco', context), prefs),
	vcf: prefs => apply(create('vcf', context), prefs),
	lfo: prefs => apply(create('lfo', context), prefs),
	vca: prefs => apply(create('vca', context), prefs)
};
