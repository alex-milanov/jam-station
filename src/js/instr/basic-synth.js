'use strict';

const filterSetFreq = (filter, value, context) => {
	const minValue = 40;
	const maxValue = context.sampleRate / 2;
	// Logarithm (base 2) to compute how many octaves fall in the range.
	var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
	// Compute a multiplier from 0 to 1 based on an exponential scale.
	var multiplier = Math.pow(2, numberOfOctaves * (value - 1.0));
	// Get back to the frequency value between min and max.
	filter.frequency.value = maxValue * multiplier;
};

const filterSetQ = (filter, value, context) => {
	const QUAL_MUL = 30;
	filter.Q.value = value * QUAL_MUL;
};

/**
 * BasicSynth instrument.
 * @param {object} context: instance of the audio context.
 * @param {int} note: default note to be played.
 */
function BasicSynth(context, note) {
	this.context = context;
	this.note = note;

	this.vco = this.context.createOscillator();
	this.vco.frequency.value = this.noteToFrequency(note);
	this.lfo = this.context.createOscillator();
	this.lfoGain = this.context.createGain();
	this.vcf = this.context.createBiquadFilter();
	this.vca = this.context.createGain();
	// this.vco.connect(this.vca);
	this.lfo.connect(this.lfoGain);
	// this.lfoGain.connect(this.vcf.frequency);
	// this.lfoGain.connect(this.vco.frequency);
	// this.vcf.connect(this.vca);
	this.vca.gain.value = 0;
	this.vco.type = 'sawtooth';
	this.lfo.type = 'sawtooth';
	this.vco.start(this.context.currentTime);
	this.lfo.start(this.context.currentTime);
	this.volume = this.context.createGain();
	this.volume.gain.value = 0.7;
	this.vca.connect(this.volume);
	this.volume.connect(this.context.destination);
}

BasicSynth.prototype.noteToFrequency = function(note) {
	var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
	var keyNumber;
	var octave;

	if (note.length === 3) {
		octave = note.charAt(2);
	} else {
		octave = note.charAt(1);
	}

	keyNumber = notes.indexOf(note.slice(0, -1));

	if (keyNumber < 3) {
		keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
	} else {
		keyNumber = keyNumber + ((octave - 1) * 12) + 1;
	}

	return 440 * Math.pow(2, (keyNumber - 49) / 12);
};

BasicSynth.prototype.setup = function(note) {

	/*
	this.osc = this.context.createOscillator();

	this.osc.frequency.value = this.noteToFrequency(note);

	this.gain = this.context.createGain();
	this.osc.connect(this.gain);
	this.gain.connect(this.context.destination)
	*/
};

BasicSynth.prototype.noteon = function(state, note, velocity) {
	const now = this.context.currentTime;
	const time = now + 0.0001;

	note = note || this.note || 'C';
	velocity = velocity || 1;

	console.log(time, state.instrument, velocity);

	// this.setup(note);
	if (state.instrument.vco.type)
		this.vco.type = state.instrument.vco.type;
	if (state.instrument.lfo.type)
		this.lfo.type = state.instrument.lfo.type;
	if (state.studio.volume)
		this.volume.gain.value = state.studio.volume;

	var frequency = this.noteToFrequency(note);
	console.log(frequency);

	this.vco.frequency.cancelScheduledValues(0);
	this.vca.gain.cancelScheduledValues(0);

	this.vco.frequency.setValueAtTime(frequency, now);

	if (state.instrument.lfo.on) {
		this.lfo.frequency.value = state.instrument.lfo.frequency || 0;
		this.lfoGain.gain.value = state.instrument.lfo.gain || 0;
		this.lfoGain.connect(this.vco.detune);
	}

	if (state.instrument.vcf.on) {
		this.vco.connect(this.vcf);
		this.vcf.connect(this.vca);
		filterSetFreq(this.vcf, state.instrument.vcf.cutoff, this.context);
		filterSetQ(this.vcf, state.instrument.vcf.resonance, this.context);
		// this.vcf.gain.setValueAtTime(state.instrument.vcf.gain, now);
	} else {
		this.vco.connect(this.vca);
	}

	// attack
	if (state.instrument.eg.attack > 0)
		this.vca.gain.setValueCurveAtTime(new Float32Array([0, velocity]), time, state.instrument.eg.attack);
	else
		this.vca.gain.setValueAtTime(velocity, time);

	// decay
	if (state.instrument.eg.decay > 0)
		this.vca.gain.setValueCurveAtTime(new Float32Array([velocity, state.instrument.eg.sustain * velocity]),
			time + state.instrument.eg.attack, state.instrument.eg.decay);
	// sustain
	// relase

	/*
	this.gain.gain.setValueAtTime(0.1, time);
	//this.gain.gain.setValueAtTime(0.01, time + duration);
	this.gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

	this.osc.start(time);

	this.osc.stop(time + duration);
	*/
};

BasicSynth.prototype.noteoff = function(state, note) {
	const time = this.context.currentTime + 0.00001;
	var frequency = this.noteToFrequency(note);
	console.log(state.instrument.eg);

	this.vca.gain.cancelScheduledValues(0);
	this.vca.gain.setValueCurveAtTime(new Float32Array([this.vca.gain.value, 0]),
		time, state.instrument.eg.release > 0 && state.instrument.eg.release || 0.00001);

	this.vco.stop(time + (state.instrument.eg.release > 0 && state.instrument.eg.release || 0.00001));
};

BasicSynth.prototype.play = function(state, note) {
	// note = note || this.note || 'C';
	var now = this.context.currentTime;
	this.trigger(now, state.instrument, note);
};

BasicSynth.prototype.clone = function(note) {
	var synth = new BasicSynth(this.context, note || this.note);
	return synth;
};

module.exports = BasicSynth;
