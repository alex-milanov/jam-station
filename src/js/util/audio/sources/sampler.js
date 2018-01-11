'use strict';

const {obj, fn} = require('iblokz-data');
const {context, create: _create, set, chain, duration, chData} = require('../core');

const create = (file, buffer) => [{
	output: _create('bufferSource')
}].map(n => (
	(!buffer)
		? fetch(file)
			.then(res => res.arrayBuffer())
			.then(buffer => context.decodeAudioData(buffer,
				buffer => set(n.output, 'buffer', buffer)
			))
		: set(n.output, 'buffer', buffer),
		n)).pop();

const update = () => {

};

const clone = n => create(null, n.output.buffer);

module.exports = {
	create,
	update,
	clone
};
