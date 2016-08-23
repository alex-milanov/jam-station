'use strict';

const snabbdom = require('snabbdom');
const h = require('snabbdom/h');

const patch = snabbdom.init([ // Init patch function with choosen modules
	require('snabbdom/modules/class'), // makes it easy to toggle classes
	require('snabbdom/modules/props'), // for setting properties on DOM elements
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

const hyperHelpers = [
	'h1', 'h2', 'h3', 'h4', 'section', 'header', 'article',
	'div', 'p', 'span', 'pre', 'code', 'a', 'dd', 'dt', 'hr', 'br', 'b', 'i',
	'table', 'thead', 'tbody', 'th', 'tr', 'td', 'ul', 'ol', 'li',
	'form', 'fieldset', 'legend', 'input', 'label', 'button', 'select', 'option',
	'canvas', 'video'
].reduce(
	(o, tag) => {
		o[tag] = function() {
			return [Array.prototype.slice.call(arguments)]
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
