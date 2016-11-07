'use strict';

const snabbdom = require('snabbdom');
const h = require('snabbdom/h');

const patch = snabbdom.init([ // Init patch function with choosen modules
	require('snabbdom/modules/class'), // makes it easy to toggle classes
	require('snabbdom/modules/props'), // for setting properties on DOM elements
	require('snabbdom/modules/attributes'), // for setting properties on DOM elements
	require('snabbdom/modules/style'), // handles styling on elements with support for animations
	require('snabbdom/modules/eventlisteners') // attaches event listeners
]);

const patchStream = (stream, dom) => {
	dom = (typeof dom === 'string') ? document.querySelector(dom) : dom;
	stream.scan(
		(vnode, newVnode) => patch(vnode, newVnode),
		dom
	).subscribe();
};

const addKeyValue = (o, k, v) => {
	o[k] = v;
	return o;
};

const processAttrs = args => {
	let newArgs = args.slice();

	let selector = newArgs[0] && typeof newArgs[0] === 'string' && newArgs[0] || '';
	if (selector !== '') newArgs = newArgs.slice(1);

	const attrRegExp = /\[[a-z\-0-9]+="[^"]+"\]/ig;

	let attrs = selector && selector.match(attrRegExp);
	selector = selector.replace(attrRegExp, '');

	attrs = attrs && attrs.map && attrs
			.map(c => c.replace(/[\[\]"]/g, '').split('='))
			.reduce((o, attr) => addKeyValue(o, attr[0], attr[1]), {}) || {};

	if (attrs && Object.keys(attrs).length > 0) {
		if (!newArgs[0] || newArgs[0]
			&& typeof newArgs[0] === 'object' && !(newArgs[0] instanceof Array)) {
			attrs = Object.assign({}, newArgs[0] && newArgs[0].attrs || {}, attrs);
			newArgs[0] = Object.assign({}, newArgs[0] || {}, {attrs});
		} else {
			newArgs = [{attrs}].concat(
				newArgs
			);
		}
	}

	if (selector !== '')
		newArgs = [selector].concat(newArgs);

	// console.log(args, newArgs);
	return newArgs;
};

const hyperHelpers = [
	'h1', 'h2', 'h3', 'h4', 'section', 'header', 'article',
	'div', 'p', 'span', 'pre', 'code', 'a', 'dd', 'dt', 'hr', 'br', 'b', 'i',
	'table', 'thead', 'tbody', 'th', 'tr', 'td', 'ul', 'ol', 'li', 'textarea',
	'form', 'fieldset', 'legend', 'input', 'label', 'button', 'select', 'option',
	'canvas', 'video'
].reduce(
	(o, tag) => {
		o[tag] = function() {
			return [Array.prototype.slice.call(arguments)]
				.map(processAttrs)
				.map(
					args => (
						args[0] && typeof args[0] === 'string'
						&& args[0].match(/^(\.|#)[a-zA-Z\-_0-9]+/ig))
						? [].concat(tag + args[0], args.slice(1))
						: [tag].concat(args))
				.map(args => h.apply(this, args))
				.pop();
		};
		return o;
	}, {}
);

module.exports = Object.assign(
	{
		h,
		patch,
		patchStream
	},
	hyperHelpers
);
