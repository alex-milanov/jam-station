import * as a from 'iblokz-audio';
import { v4 as uuidv4 } from 'uuid';
import { fn } from 'iblokz-data';

// id -> node
const nodesMap = {};

export const get = (id) => nodesMap[id];
export const add = (id, node) => (Object.assign(nodesMap, { [id]: node }), node);
export const remove = (id) => (delete nodesMap[id]);

export const create = (type, prefs = {}, id = uuidv4()) => 
    add(id, Object.assign(a.create(type, prefs), { id }));

export const destroy = (node) => fn.pipe(
	() => typeof node === 'string' ? get(node) : node,
	node => node && (
		node.source && node.source.stop && node.source.stop(),
		node.input && node.input.disconnect && node.input.disconnect(),
		node.output && node.output.disconnect && node.output.disconnect(),
		node.through && node.through.disconnect && node.through.disconnect(),
		remove(node.id)
	)
)();