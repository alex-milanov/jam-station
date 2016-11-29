'use strict';

const studio = require('./studio');
const midi = require('./midi');
const layout = require('./layout');

const services = [midi, layout];

const init = ({actions}) =>
	services.forEach(service => service.init({actions}));
const refresh = ({state, actions}) =>
	services.forEach(service => service.refresh({state, actions}));

module.exports = {
	init,
	refresh,
	midi,
	layout
};
