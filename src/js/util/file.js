'use strict';

const Rx = require('rx');
const $ = Rx.Observable;
const fileSaver = require('file-saver');
const jsZip = require("jszip");
const {fn, obj} = require("iblokz-data");

const load = (file, readAs = 'text') => $.create(stream => {
	const fr = new FileReader();
	fr.onload = function(ev) {
		// console.log(readAs, ev.target.result);
		stream.onNext(
			readAs === 'json'
				? JSON.parse(ev.target.result)
				: ev.target.result
		);
		stream.onCompleted();
	};
	// console.log(file, readAs);
	((typeof file === 'string')
		? $.fromPromise(fetch(file)).flatMap(res => res.blob())
		: $.just(file))
		.subscribe(f => fn.switch(readAs, {
			arrayBuffer: f => fr.readAsArrayBuffer(f),
			default: f => fr.readAsText(f)
		})(f));
});

const loadZip = file => load(file, 'arrayBuffer')
	.flatMap(data => $.fromPromise(jsZip.loadAsync(data)))
	.flatMap(zf => $.concat(
		Object.keys(zf.files)
			.filter(k => !zf.files[k].dir)
			// .map(k => (console.log(k), k))
			.map(k => $.fromPromise(zf.files[k].async('arraybuffer')).map(v => ({k, v})))
		).reduce((o, {k, v}) => obj.patch(o, k, v), {})
	);

const save = (fileName, content) => fileSaver.saveAs(
	new Blob([JSON.stringify(content)], {type: "text/plain;charset=utf-8"}),
	fileName
);

module.exports = {
	load,
	loadZip,
	save
};
