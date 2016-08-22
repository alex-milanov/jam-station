'use strict';

const assignPropVal = (o, p, v) => {
	let t = {};
	t[p] = v;
	return Object.assign({}, o, t);
};

module.exports = {
	assignPropVal
};
