'use strict';

const {obj, fn} = require('iblokz-data');
const {context, create: _create, set, chain, duration, chData} = require('../core');

const create = (file, buffer, prefs = {}) => [{
	prefs: Object.assign({
		gain: 0.7
	}, prefs),
	source: _create('bufferSource'),
	output: _create('gain')
}].map(n => (
	chain(n.source, n.output),
	set(n.output.gain, 'value', n.prefs.gain),
	(!buffer)
		? fetch(file)
			.then(res => res.arrayBuffer())
			.then(buffer => context.decodeAudioData(buffer,
				buffer => set(n.source, 'buffer', buffer)
			))
		: set(n.source, 'buffer', buffer),
		n)).pop();

const update = () => {

};

const clone = (n, prefs) => create(null, n.source.buffer, Object.assign({}, n.prefs, prefs));

module.exports = {
	create,
	update,
	clone
};
