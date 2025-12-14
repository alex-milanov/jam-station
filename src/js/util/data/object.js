/**
 * Object Utils
 * @module util/data/object
 */

import {fn} from 'iblokz-data';
const pipe = fn.pipe;

const combineWithIfObject = (val, obj) =>
	val instanceof Object ? {...obj, ...val} : val

/**
 * patch function 
 * @alias module:util/data/object.patch
 * @param {Object} obj - object to be patched
 * @param {String|Array<String>} path - a path where the patch should be applied
 * @param {Object|Function} patchVal - object with the patch, or function to process the patch
 * @return {Object} a patched object.
 */
export const patch = (obj = {}, path, patchVal) => pipe(
  () => path instanceof Array ?  path : path.split('.'),
  path => ({
    ...(obj ?? {}),
    [path[0]]: (path.length > 1)
      ? patch(obj[path[0]] ?? {}, path.slice(1), patchVal)
      : patchVal instanceof Function
				? combineWithIfObject(patchVal(obj[path[0]]), obj[path[0]]) 
				: combineWithIfObject(patchVal, obj[path[0]])
  }) 
)();

export const patchAt = (obj = {}, patchTree = {}) =>
	Object.keys(patchTree)
		.map(path => ({path, patchVal: patchTree[path]}))
		.reduce((patchedObj, {path, patchVal}) =>
			patch(patchedObj, path, patchVal), obj);

export const sub = (obj = {}, path) => pipe(
  () => path instanceof Array ?  path : path.split('.'),
  path => ({
    ...(obj ?? {}),
    [path[0]]: (path.length > 1)
      ? sub(obj[path[0]] ?? {}, path.slice(1))
      : obj[path[0]]
  })
)();
