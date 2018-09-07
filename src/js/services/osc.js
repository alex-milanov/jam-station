'use strict';
// lib
const Rx = require('rx');
const $ = Rx.Observable;

//
// let osc = require('osc/src/osc.js');
// window.osc = osc;
// require('osc/src/osc-transports.js');
// require('osc/src/platforms/osc-websocket-client.js');

// const WebSocket = require('ws')
const ws = new WebSocket('ws://127.0.0.1:10138/myo/3?appid=com.myojs.diagnostics');

let unhook = () => {};

const hook = ({state$, actions}) => {
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

	ws.onopen = () => console.log('osc connected');
	const dataMsg$ = new Rx.Subject();
	ws.onmessage = data => dataMsg$.onNext(JSON.parse(data.data));

	subs.push(
		dataMsg$
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

	// ws.onmessage = data => console.log(JSON.parse(data.data));

	unhook = () => subs.forEach(sub => sub.unsubscribe());
};

module.exports = {
	hook,
	unhook
};
