'use strict';

const {
	div, span, button, i
} = require('iblokz-snabbdom-helpers');
const {obj} = require('iblokz-data');
const WaveSurfer = require('wavesurfer.js');
const pocket = require('../../../util/pocket');

let wavesurferInstance = null;
let currentSampleFile = null;

const initWavesurfer = (containerId, sampleUrl, sampleBuffer) => {
	// Clean up existing instance if any
	if (wavesurferInstance) {
		wavesurferInstance.destroy();
		wavesurferInstance = null;
	}

	// Wait for container to exist and WaveSurfer to be available
	const tryInit = () => {
		const container = document.querySelector(`#${containerId}`);
		if (!container) {
			setTimeout(tryInit, 10);
			return;
		}

		// Check if WaveSurfer is available
		if (!WaveSurfer) {
			console.warn('WaveSurfer not available');
			return;
		}

		// Create wavesurfer instance
		// WaveSurfer v7 uses create() method
		try {
			if (typeof WaveSurfer.create === 'function') {
				wavesurferInstance = WaveSurfer.create({
					container: `#${containerId}`,
					waveColor: '#000',
					progressColor: '#111516',
					height: 128
				});
			} else if (typeof WaveSurfer === 'function') {
				// Fallback for older API
				wavesurferInstance = new WaveSurfer({
					container: `#${containerId}`,
					waveColor: '#000',
					progressColor: '#111516',
					height: 128
				});
			}

			// Load sample
			if (wavesurferInstance) {
				if (sampleBuffer) {
					wavesurferInstance.loadDecodedBuffer(sampleBuffer);
				} else if (sampleUrl) {
					wavesurferInstance.load(sampleUrl);
				}
			}
		} catch (err) {
			console.error('Error creating WaveSurfer instance:', err);
		}
	};

	setTimeout(tryInit, 0);
};

module.exports = ({state, actions}) => {
	// Get selected sequencer channel
	const selectedChannel = state.sequencer.channel;
	const channelSampleIndex = selectedChannel > -1 && state.sequencer.channels[selectedChannel];
	const sampleFileName = channelSampleIndex !== undefined && state.mediaLibrary.files[channelSampleIndex];
	
	// Get sample buffer from pocket if available
	let sampleBuffer = null;
	let sampleUrl = null;
	
	if (sampleFileName) {
		const sampleNode = pocket.get(['sampleBank', sampleFileName]);
		if (sampleNode && sampleNode.output && sampleNode.output.buffer) {
			sampleBuffer = sampleNode.output.buffer;
		} else {
			sampleUrl = sampleFileName;
		}
	}

	const containerId = 'sampler-wavesurfer';
	const displayName = sampleFileName 
		? sampleFileName.replace(/\.(ogg|wav|mp3|aif)$/, '')
		: 'No sample selected';

	// Initialize or update wavesurfer when sample changes
	if (sampleFileName !== currentSampleFile && (sampleBuffer || sampleUrl)) {
		currentSampleFile = sampleFileName;
		initWavesurfer(containerId, sampleUrl, sampleBuffer);
	}

	return div('.sampler', [
		div('.sampler-header', [
			span('.sample-name', displayName)
		]),
		div('.sampler-wavesurfer', [
			div(`#${containerId}`, {
				hook: {
					insert: (vnode) => {
						if (sampleBuffer || sampleUrl) {
							initWavesurfer(containerId, sampleUrl, sampleBuffer);
						}
					},
					destroy: (vnode) => {
						if (wavesurferInstance) {
							wavesurferInstance.destroy();
							wavesurferInstance = null;
							currentSampleFile = null;
						}
					}
				}
			})
		]),
		div('.sampler-controls', [
			button('.fa.fa-play', {
				on: {
					click: () => {
						if (wavesurferInstance) {
							wavesurferInstance.playPause();
						}
					}
				}
			})
		])
	]);
};

