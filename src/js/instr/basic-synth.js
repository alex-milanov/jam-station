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

	this.vco1 = this.context.createOscillator();
	this.vco1.frequency.value = this.noteToFrequency(note);
	this.vco2 = this.context.createOscillator();
	this.vco2.frequency.value = this.noteToFrequency(note);
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
	this.vco1.type = 'sawtooth';
	this.vco2.type = 'sawtooth';
	this.lfo.type = 'sawtooth';
	this.vco1.start(this.context.currentTime);
	this.vco2.start(this.context.currentTime);
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

	console.log(time, state.rack, velocity);

	// this.setup(note);
	if (state.rack.vco1.type)
		this.vco1.type = state.rack.vco1.type;
	if (state.rack.vco1.detune)
		this.vco1.detune.value = state.rack.vco1.detune;
	if (state.rack.vco2.type)
		this.vco2.type = state.rack.vco2.type;
	if (state.rack.vco2.detune)
		this.vco2.detune.value = state.rack.vco2.detune;
	if (state.rack.lfo.type)
		this.lfo.type = state.rack.lfo.type;
	if (state.studio.volume)
		this.volume.gain.value = state.studio.volume;

	var frequency = this.noteToFrequency(note);
	console.log(frequency);

	this.vco1.frequency.cancelScheduledValues(0);
	this.vco2.frequency.cancelScheduledValues(0);
	this.vca.gain.cancelScheduledValues(0);

	this.vco1.frequency.setValueAtTime(frequency, now);
	this.vco2.frequency.setValueAtTime(frequency, now);

	if (state.rack.lfo.on) {
		this.lfo.frequency.value = state.rack.lfo.frequency || 0;
		this.lfoGain.gain.value = state.rack.lfo.gain || 0;
		this.lfoGain.connect(this.vco1.detune);
		this.lfoGain.connect(this.vco2.detune);
	}

	if (state.rack.vcf.on) {
		if (state.rack.vco1.on) this.vco1.connect(this.vcf);
		if (state.rack.vco2.on) this.vco2.connect(this.vcf);
		this.vcf.connect(this.vca);
		filterSetFreq(this.vcf, state.rack.vcf.cutoff, this.context);
		filterSetQ(this.vcf, state.rack.vcf.resonance, this.context);
		// this.vcf.gain.setValueAtTime(state.rack.vcf.gain, now);
	} else {
		if (state.rack.vco1.on) this.vco1.connect(this.vca);
		if (state.rack.vco2.on) this.vco2.connect(this.vca);
	}

	// attack
	if (state.rack.eg.attack > 0)
		this.vca.gain.setValueCurveAtTime(new Float32Array([0, velocity]), time, state.rack.eg.attack);
	else
		this.vca.gain.setValueAtTime(velocity, now);

	// decay
	if (state.rack.eg.decay > 0)
		this.vca.gain.setValueCurveAtTime(new Float32Array([velocity, state.rack.eg.sustain * velocity]),
			time + state.rack.eg.attack, state.rack.eg.decay);
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
	console.log(state.rack.eg);

	this.vca.gain.cancelScheduledValues(0);
	this.vca.gain.setValueCurveAtTime(new Float32Array([this.vca.gain.value, 0]),
		time, state.rack.eg.release > 0 && state.rack.eg.release || 0.00001);

	this.vco1.stop(time + (state.rack.eg.release > 0 && state.rack.eg.release || 0.00001));
	this.vco2.stop(time + (state.rack.eg.release > 0 && state.rack.eg.release || 0.00001));
};

BasicSynth.prototype.play = function(state, note) {
	// note = note || this.note || 'C';
	var now = this.context.currentTime;
	this.trigger(now, state.rack, note);
};

BasicSynth.prototype.clone = function(note) {
	var synth = new BasicSynth(this.context, note || this.note);
	return synth;
};

module.exports = BasicSynth;
