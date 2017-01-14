'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const fileSaver = require('file-saver');

const load = file => $.create(stream => {
	const fr = new FileReader();
	fr.onload = function(ev) {
		stream.onNext(JSON.parse(ev.target.result));
		stream.onCompleted();
	};
	fr.readAsText(file);
});
/*
{
  stream.onNext(42);
  stream.onCompleted();
});
*/

const save = (fileName, content) => fileSaver.saveAs(
	new Blob([JSON.stringify(content)], {type: "text/plain;charset=utf-8"}),
	fileName
);

module.exports = {
	load,
	save
};
