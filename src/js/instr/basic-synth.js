'use strict';
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
	this.output = this.context.createGain();
	this.vco.connect(this.vcf);
	this.lfo.connect(this.lfoGain);
	this.lfoGain.connect(this.vcf.frequency);
	// this.lfoGain.connect(this.vco.frequency);
	this.vcf.connect(this.output);
	this.output.gain.value = 0;
	this.vco.type = 'sawtooth';
	this.lfo.type = 'sawtooth';
	this.vco.start(this.context.currentTime);
	this.lfo.start(this.context.currentTime);
	this.volume = this.context.createGain();
	this.volume.gain.value = 0.7;
	this.output.connect(this.volume);
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

BasicSynth.prototype.noteon = function(props, note, velocity) {
	const now = this.context.currentTime;
	const time = now + 0.0001;

	note = note || this.note || 'C';
	velocity = velocity || 1;

	console.log(time, props, velocity);

	// this.setup(note);
	if (props.vco.type)
		this.vco.type = props.vco.type;
	if (props.lfo.type)
		this.lfo.type = props.lfo.type;

	var frequency = this.noteToFrequency(note);
	console.log(frequency);

	this.vco.frequency.cancelScheduledValues(0);
	this.output.gain.cancelScheduledValues(0);

	this.vco.frequency.setValueAtTime(frequency, now);
	// this.lfo.frequency.setValueAtTime(props.lfo.frequency || 0, now);
	// this.lfoGain.gain.setValueAtTime(props.lfo.gain || 0, now);
	if (props.vcf.on) {
		this.vcf.frequency.value = props.vcf.cutoff;
		this.vcf.Q.value = props.vcf.resonance;
		// this.vcf.gain.setValueAtTime(props.vcf.gain, now);
	}
	// attack
	if (props.eg.attack > 0)
		this.output.gain.setValueCurveAtTime(new Float32Array([0, velocity]), time, props.eg.attack);
	else
		this.output.gain.setValueAtTime(velocity, time);

	// decay
	if (props.eg.decay > 0)
		this.output.gain.setValueCurveAtTime(new Float32Array([velocity, 0.8 * velocity]),
			time + props.eg.attack, props.eg.decay);
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

BasicSynth.prototype.noteoff = function(props, note) {
	const time = this.context.currentTime + 0.00001;
	var frequency = this.noteToFrequency(note);
	console.log(props.eg);

	this.output.gain.cancelScheduledValues(0);
	this.output.gain.setValueCurveAtTime(new Float32Array([this.output.gain.value, 0]),
		time + props.eg.sustain, props.eg.release > 0 && props.eg.release || 0.00001);

	this.vco.stop(time + props.eg.sustain + (props.eg.release > 0 && props.eg.release || 0.00001));
};

BasicSynth.prototype.play = function(props, note) {
	// note = note || this.note || 'C';
	var now = this.context.currentTime;
	this.trigger(now, props, note);
};

BasicSynth.prototype.clone = function(note) {
	var synth = new BasicSynth(this.context, note || this.note);
	return synth;
};

module.exports = BasicSynth;
