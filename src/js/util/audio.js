'use strict';

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
	}
};

const context = new (
	window.AudioContext || window.webkitAudioContext
	|| window.mozAudioContext || window.oAudioContext
	|| window.msAudioContext)();

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
	(node1.node && node1.node.connect && node1.node
	|| node1.connect && node1).connect(
		node2.node || node2
	), node1
);

const apply = (node, prefs) => Object.keys(prefs)
	.filter(pref => prefsMap[node.type][pref] !== undefined)
	.reduce((node, pref) => {
		// console.log(pref, prefs[pref]);
		if (pref === 'type')
			node.node[prefsMap[node.type][pref]] = prefs[pref];
		else
			node.node[prefsMap[node.type][pref]].value = prefs[pref];
		return node;
	}, node);

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
	apply,
	start,
	stop
};
