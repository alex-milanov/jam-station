'use strict';

const {obj, fn} = require('iblokz-data');

let context = new (
	window.AudioContext
	|| window.webkitAudioContext
	|| window.mozAudioContext
	|| window.oAudioContext
	|| window.msAudioContext
)();

/*
	type
	node1 (vco1)
	node1 (vco2)
	in
	out
	connections
*/

const buildImpulse = ({seconds, decay}) => {
	var length = context.sampleRate * seconds;
	var impulse = context.createBuffer(2, context.sampleRate * seconds, context.sampleRate);
	var impulseL = impulse.getChannelData(0);
	var impulseR = impulse.getChannelData(1);
	var n;
	var i;

	for (i = 0; i < length; i++) {
		// n = this.reverse === true ? length - i : i;
		n = i;
		impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
		impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
	}
	return impulse;
};

const createMap = {
	default: (type, context) =>
	Object.assign({type, out: []}, {
		vco: () => ({node: context.createOscillator()}),
		lfo: () => ({node: context.createOscillator()}),
		vca: () => ({node: context.createGain()}),
		vcf: () => ({node: context.createBiquadFilter()}),
		reverb: () => ({
			prefs: {seconds: 3, decay: 2},
			input: context.createGain(),
			output: context.createGain(),
			effect: context.createConvolver(),
			wet: context.createGain(),
			dry: context.createGain()
		})
	}[type]()
	)
};

const prefsMap = {
	vco: {
		type: (node, value) => ((node.node.type = value), node),
		freq: (node, value) => ((node.node.frequency.value = value), node),
		detune: (node, value) => ((node.node.detune.value = value), node)
	},
	vcf: {
		type: (node, value) => ((node.node.type = value), node),
		cutoff: (node, value) => {
			const minValue = 40;
			const maxValue = node.node.context.sampleRate / 2;
			// Logarithm (base 2) to compute how many octaves fall in the range.
			var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
			// Compute a multiplier from 0 to 1 based on an exponential scale.
			var multiplier = Math.pow(2, numberOfOctaves * (value - 1.0));
			// Get back to the frequency value between min and max.
			node.node.frequency.value = maxValue * multiplier;
			return node;
		},
		resonance: (node, value) => ((node.node.Q.value = value * 30), node)
	},
	vca: {
		gain: (node, value) => ((node.node.gain.value = value), node)
	},
	delay: {
		time: (node, value) => ((node.delay.delayTime.value = value), node),
		dry: (node, value) => ((node.dry.gain.value = value), node),
		wet: (node, value) => ((node.wet.gain.value = value), node)
	}
};

const create = (type, context) => fn.switch(type, createMap)(type, context);

const connect = (node1, node2) => !(node1.out && node1.out.indexOf(node2) > -1)
	? (((node1.node && node1.node.connect)
			? node1.node
			: node1).connect(
			node2.node || node2
		), Object.assign({}, node1, {
			out: [].concat(node1.out, [node2])
		}))
	: node1;

const disconnect = (node1, node2) => (node1.out.indexOf(node2) > -1)
	? (((node1.node && node1.node.connect)
		? node1.node
		: node1).disconnect(
			node2.node || node2
		), Object.assign({}, node1, {
			out: [].concat(
				node1.out.slice(0, node1.out.indexOf(node2)),
				node1.out.slice(node1.out.indexOf(node2) + 1)
			)
		}))
	: (typeof node2 === 'undefined')
		&& node1.out.reduce((node1, prevNode) => disconnect(node1, prevNode), node1)
		|| node1;

const reroute = (node1, node2) => connect(disconnect(node1), node2);

const chain = nodes => nodes.forEach(
	(node, i) => {
		if (nodes[i + 1]) connect(node, nodes[i + 1]);
	}
);

const apply = (node, prefs) => Object.keys(prefs)
	.filter(pref => prefsMap[node.type][pref] !== undefined)
	// .map(pref => (console.log('pref', node, pref), pref))
	.reduce(
		(node, pref) => prefsMap[node.type][pref](node, prefs[pref]),
		node
	);

const scheduleChanges = (node, pref, values, times) => (values.length === 1)
	? node.node[pref].setValueAtTime(values[0], times[0])
	: (node.node[pref].setValueCurveAtTime(new Float32Array(values.slice(0, 2)), times[0], times[1]),
		(values.length > 2) && scheduleChanges(node, pref, values.slice(1), [times[0] + times[1]].concat(times.slice(2))));

const add = (type, prefs, context) => apply(create(type, context), prefs);

const start = function(node) {
	node.node.start.apply(node.node, Array.from(arguments).slice(1));
	return node;
};

const stop = function(node) {
	node.node.stop.apply(node.node, Array.from(arguments).slice(1));
	return node;
};

const noteToFrequency = function(note) {
	var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
	var keyNumber;
	var octave;

	if (note.length === 3) {
		octave = note.charAt(2);
	} else {
		octave = note.charAt(1);
	}

	keyNumber = notes.indexOf(note.slice(0, -1));

	if (keyNumber < 3) {
		keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
	} else {
		keyNumber = keyNumber + ((octave - 1) * 12) + 1;
	}

	return 440 * Math.pow(2, (keyNumber - 49) / 12);
};

module.exports = {
	context,
	create,
	connect,
	disconnect,
	reroute,
	chain,
	apply,
	scheduleChanges,
	add,
	start,
	stop,
	noteToFrequency,
	vco: prefs => apply(create('vco', context), prefs),
	vcf: prefs => apply(create('vcf', context), prefs),
	lfo: prefs => apply(create('lfo', context), prefs),
	vca: prefs => apply(create('vca', context), prefs)
};
