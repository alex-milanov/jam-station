'use strict';

const {Observable, from, concat, EMPTY} = require('rxjs');
const {flatMap, map, reduce, catchError} = require('rxjs/operators');
const fileSaver = require('file-saver');
const jsZip = require("jszip");
const {fn, obj} = require("iblokz-data");

const load = (file, readAs = 'text') => new Observable(observer => {
	const fr = new FileReader();
	fr.onload = function(ev) {
		// console.log(readAs, ev.target.result);
		observer.next(
			readAs === 'json'
				? JSON.parse(ev.target.result)
				: ev.target.result
		);
		observer.complete();
	};
	fr.onerror = function(err) {
		observer.error(err);
	};
	// console.log(file, readAs);
	((typeof file === 'string')
		? from(fetch(file)).pipe(
			flatMap(res => from(res.blob()))
		)
		: from([file]))
		.subscribe({
			next: f => fn.switch(readAs, {
				arrayBuffer: f => fr.readAsArrayBuffer(f),
				default: f => fr.readAsText(f)
			})(f),
			error: err => observer.error(err)
		});
});

const loadZip = file => load(file, 'arrayBuffer').pipe(
	flatMap(data => from(jsZip.loadAsync(data))),
	flatMap(zf => concat(
		...Object.keys(zf.files)
			.filter(k => !zf.files[k].dir)
			// .map(k => (console.log(k), k))
			.map(k => from(zf.files[k].async('arraybuffer')).pipe(
				map(v => ({k, v}))
			))
		).pipe(
			reduce((o, {k, v}) => obj.patch(o, k, v), {})
		)
	)
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
