# Audio Service Integration for New Instrument Structure

## Summary
The audio service currently uses the old instrument structure. It needs to be updated to work with the new structure where:
- Source properties are in `instr.source.vco1`, `instr.source.vco2`, `instr.source.vca1`, `instr.source.vca2`
- Effects are in `instr.effectsChain` array instead of direct properties
- Effects have `type`, `on`, and other properties

## Required Changes

### 1. Helper Functions Needed

Create helper functions to work with the new structure:

```javascript
// Get effect by type from effectsChain
const getEffect = (instr, type) => 
  instr.effectsChain?.find(e => e.type === type);

// Check if effect is on
const isEffectOn = (instr, type) => {
  const effect = getEffect(instr, type);
  return effect ? effect.on : false;
};

// Get source property (handles both old and new structure for compatibility)
const getSourceProp = (instr, prop) => 
  instr.source?.[prop] ?? instr[prop];
```

### 2. Update `updateConnections` function (lines 181-206)

**Current issues:**
- Uses `instr.vco1.on`, `instr.vco2.on` → should be `instr.source.vco1.on`, `instr.source.vco2.on`
- Uses `instr.vcf.on`, `instr.reverb.on` → should check `instr.effectsChain`
- Hardcoded routing: `reverb → vcf → volume` → should respect `effectsChain` order

**Changes needed:**
- Update VCO references: `instr.vco1.on` → `instr.source.vco1.on`
- Update VCO references: `instr.vco2.on` → `instr.source.vco2.on`
- Update effect checks: `instr.vcf.on` → `isEffectOn(instr, 'vcf')`
- Update effect checks: `instr.reverb.on` → `isEffectOn(instr, 'reverb')`
- Update routing logic to use effectsChain order instead of hardcoded order

### 3. Update `updatePrefs` function (lines 163-174)

**Current issues:**
- Uses `instr[key]` directly which won't work with nested structure

**Changes needed:**
- Update to handle `instr.source.vco1`, `instr.source.vco2`, `instr.source.vca1`, `instr.source.vca2`
- Update to handle effects from `instr.effectsChain`

### 4. Update `noteOn` function (lines 216-284)

**Current issues:**
- Uses `instr.vco1`, `instr.vco2` → should be `instr.source.vco1`, `instr.source.vco2`
- Uses `instr.vca1`, `instr.vca2` → should be `instr.source.vca1`, `instr.source.vca2`
- Uses `instr.vco1.on`, `instr.vco2.on` → should be `instr.source.vco1.on`, `instr.source.vco2.on`
- Uses `instr.reverb.on`, `instr.vcf.on` → should check `instr.effectsChain`
- Uses `instr.lfo.on`, `instr.lfo.target` → should check `instr.effectsChain`

**Changes needed:**
- Line 231: `instr.vco1` → `instr.source.vco1`
- Line 233: `instr.vca1` → `instr.source.vca1`
- Line 235: `instr.vco1.on` → `instr.source.vco1.on`
- Line 237: `instr.reverb.on` → `isEffectOn(instr, 'reverb')`
- Line 237: `instr.vcf.on` → `isEffectOn(instr, 'vcf')`
- Line 243: `instr.vco2` → `instr.source.vco2`
- Line 245: `instr.vca2` → `instr.source.vca2`
- Line 247: `instr.vco2.on` → `instr.source.vco2.on`
- Line 249: `instr.reverb.on` → `isEffectOn(instr, 'reverb')`
- Line 249: `instr.vcf.on` → `isEffectOn(instr, 'vcf')`
- Line 251: `instr.lfo.on` → `isEffectOn(instr, 'lfo')`
- Line 252: `instr.lfo.target` → `getEffect(instr, 'lfo')?.target`

### 5. Update `noteOff` function (lines 294-318)

**Current issues:**
- Uses `instr.vca1.release`, `instr.vca2.release` → should be `instr.source.vca1.release`, `instr.source.vca2.release`

**Changes needed:**
- Line 308: `instr.vca1.release` → `instr.source.vca1.release`
- Line 309: `instr.vca2.release` → `instr.source.vca2.release`
- Line 316: `instr.vca1.release` → `instr.source.vca1.release`

### 6. Update `pitchBend` function (lines 320-329)

**Current issues:**
- Uses `instr.vco1.detune`, `instr.vco2.detune` → should be `instr.source.vco1.detune`, `instr.source.vco2.detune`

**Changes needed:**
- Line 326: `instr.vco1.detune` → `instr.source.vco1.detune`
- Line 327: `instr.vco2.detune` → `instr.source.vco2.detune`

### 7. Update `distinctUntilChanged` checks (lines 372-394)

**Current issues:**
- Lines 375, 378: Uses `track.inst.vco1.on`, `track.inst.vco2.on`, `track.inst.vcf.on`, `track.inst.lfo.on`, `track.inst.reverb.on`
- These don't exist in the new structure

**Changes needed:**
- Update to check `track.inst.source.vco1.on`, `track.inst.source.vco2.on`
- Update to check effects from `track.inst.effectsChain` array
- Consider checking the entire effectsChain structure

### 8. Effects Chain Routing Logic

**Current approach:**
- Hardcoded: `reverb → vcf → volume` or `vcf → volume`

**New approach needed:**
- Build routing chain from `instr.effectsChain` array in order
- Only include effects where `effect.on === true`
- Connect: `source → effectsChain (in order) → volume → globalVolume`

**Example routing function:**
```javascript
const buildEffectsChain = (instr, engine, ch) => {
  const activeEffects = instr.effectsChain
    .filter(effect => effect.on)
    .map(effect => {
      switch(effect.type) {
        case 'vcf': return engine[ch].vcf;
        case 'reverb': return engine[ch].reverb;
        case 'lfo': return engine[ch].lfo;
        case 'delay': return engine[ch].delay;
        default: return null;
      }
    })
    .filter(e => e !== null);
  
  return activeEffects;
};
```

## Implementation Priority

1. **High Priority** (breaks functionality):
   - Update source property references (`vco1`, `vco2`, `vca1`, `vca2`)
   - Update effect checks in `noteOn` and `updateConnections`

2. **Medium Priority** (affects routing):
   - Implement effectsChain routing logic
   - Update `updatePrefs` to handle new structure

3. **Low Priority** (optimization):
   - Update `distinctUntilChanged` checks
   - Add helper functions for cleaner code

## Testing Checklist

- [ ] VCO1/VCO2 properties update correctly
- [ ] VCA1/VCA2 properties update correctly
- [ ] VCF effect works and routes correctly
- [ ] Reverb effect works and routes correctly
- [ ] LFO effect works and routes correctly
- [ ] Effects chain order is respected
- [ ] Turning effects on/off works
- [ ] Multiple effects in chain work together
- [ ] Note on/off works with new structure
- [ ] Pitch bend works with new structure

