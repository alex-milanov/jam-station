'use strict';

const {div, h1, header, i} = require('../util/vdom');
const sequencer = require('./sequencer');

module.exports = ({state, actions}) => div('#ui', [
	header([h1([i('.fa.fa-music'), ' Jam Station'])]),
	sequencer({state, actions})
]);
