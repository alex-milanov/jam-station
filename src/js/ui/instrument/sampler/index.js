import {
	div, span, button, i
} from 'iblokz-snabbdom-helpers';
import {obj} from 'iblokz-data';
import WaveSurfer from 'wavesurfer.js';
import pocket from '../../../util/pocket';

let wavesurferInstance = null;
let currentSampleFile = null;

const initWavesurfer = (containerId, sampleUrl, sampleBuffer) => {
	// Clean up existing instance if any
	if (wavesurferInstance) {
		wavesurferInstance.destroy();
		wavesurferInstance = null;
	}

	// Wait for container to exist (similar to xAmplR pattern)
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

		// Create wavesurfer instance (xAmplR uses WaveSurfer.create directly)
		try {
			// Clear container like xAmplR does
			container.innerHTML = '';
			
			// WaveSurfer v7 uses create() method (same as xAmplR v2)
			wavesurferInstance = WaveSurfer.create({
				container: `#${containerId}`,
				waveColor: '#000',
				progressColor: '#111516',
				height: 128
			});

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

export default ({state, actions}) => {
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
						// Initialize wavesurfer when container is inserted (like xAmplR)
						initWavesurfer(containerId, sampleUrl, sampleBuffer);
					},
					update: (oldVnode, vnode) => {
						// Update sample when it changes
						if (sampleFileName !== currentSampleFile && wavesurferInstance) {
							currentSampleFile = sampleFileName;
							if (sampleBuffer) {
								wavesurferInstance.loadDecodedBuffer(sampleBuffer);
							} else if (sampleUrl) {
								wavesurferInstance.load(sampleUrl);
							}
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

