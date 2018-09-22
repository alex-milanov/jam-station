'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;
const ws = require('../util/ws');

//
// let osc = require('osc/src/osc.js');
// window.osc = osc;
// require('osc/src/osc-transports.js');
// require('osc/src/platforms/osc-websocket-client.js');

// const WebSocket = require('ws')
const myoWs = new WebSocket('ws://127.0.0.1:10138/myo/3?appid=com.myojs.diagnostics');
const wrldsWs = new WebSocket('ws://127.0.0.1:8888');

let unhook = () => {};

const hook = ({state$, actions, tapTempo}) => {
	let subs = [];

	// let oscPort = new osc.WebSocketPort({
	// 	url: "ws://127.0.0.1:10138/myo/3?appid=com.myojs.diagnostics", // URL to your Web Socket server.
	// 	metadata: true
	// });
	//
	// oscPort.open();
	// // Listening for incoming OSC messages:
	// oscPort.on("message", function(oscMsg) {
	// 	console.log("An OSC message just arrived!", oscMsg);
	// });

	myoWs.onopen = () => console.log('myo osc connected');
	const myoMsg$ = new Rx.Subject();
	myoWs.onmessage = data => myoMsg$.onNext(JSON.parse(data.data));

	// wrldsWs.onopen = () => console.log('wrlds osc connected');
	const wrldsMsg$ = state$
		.distinctUntilChanged(state => state.wrlds.on)
		.filter(state => state.wrlds.on)
		.flatMap(() =>
			ws.connect({port: 8888, retry: true})
		);
	// wrldsWs.onmessage = data => wrldsMsg$.onNext(JSON.parse(data.data));

	subs.push(
		myoMsg$
			.withLatestFrom(state$, (data, state) => ({data, state}))
			.filter(({data}) => data[1].type === 'orientation')
			// .map(data => (console.log(data), data))
			.sample(100)
			.subscribe(({data, state}) => {
				actions.set(['myo', 'osc'], data[1]);
				// orientation
				if (state.myo.on) {
					actions.change('instrument', ['vcf', 'cutoff'],
						state.myo.reverse
							? 1 - (data[1].orientation.y + 1).toFixed(2) / 2
							: (data[1].orientation.y + 1).toFixed(2) / 2
					);
					actions.change('instrument', ['vcf', 'resonance'],
						state.myo.reverse
							? 1 - (data[1].orientation.x + 1).toFixed(2) / 2
							: (data[1].orientation.x + 1).toFixed(2) / 2
					);
				}
			})
	);
	subs.push(
		wrldsMsg$
			.map(data => JSON.parse(data.data))
			.withLatestFrom(state$, (data, state) => ({data, state}))
			.subscribe(({state, data}) => {
				if (state.wrlds.on) {
					if (data.type === 'wrldsBounce') {
						if (state.wrlds.mode === 0) {
							tapTempo.tap();
						}
						if (state.wrlds.mode === 1) {
							if (data.acc < state.wrlds.threshold) {
								actions.midiMap.noteOn(-1, 10, 'C1', 7);
								actions.midiMap.noteOn(-1, 10, 'C1', 0);
							} else {
								actions.midiMap.noteOn(-1, 10, 'D1', 7);
								actions.midiMap.noteOn(-1, 10, 'D1', 0);
							}
						}
					}
					if (data.type === 'wrldsRotate') {
						actions.set(['wrlds', 'rotation'], data.rotation);
						if (state.wrlds.mode === 2) {
							let cutoff = Number((state.instrument.vcf.cutoff + data.rotation[0] / 10000).toFixed(2));
							let resonance = Number((state.instrument.vcf.resonance + data.rotation[1] / 10000).toFixed(2));
							if (cutoff > 0 && cutoff < 1)
								actions.set(['instrument', 'vcf', 'cutoff'], cutoff);
							if (resonance > 0 && resonance < 1)
								actions.set(['instrument', 'vcf', 'resonance'], resonance);
						}
					}
				}
				// console.log(data);
			})
	);

	// ws.onmessage = data => console.log(JSON.parse(data.data));

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
