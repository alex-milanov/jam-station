# Library Integration

This project uses `iblokz-audio`, `iblokz-data`, and `iblokz-state` from npm as the default dependencies. For local development with changes to these libraries, you can optionally link to local versions.

## Using Published npm Versions (Default)

The project uses published npm versions by default:

```json
"dependencies": {
  "iblokz-audio": "^0.1.0",
  "iblokz-data": "^1.6.0",
  "iblokz-snabbdom-helpers": "^2.0.0",
  "iblokz-state": "^1.1.0"
}
```

Just run:
```bash
pnpm install
```

## Optional: Local Development with iblokz Libraries

If you're making changes to any `iblokz-*` library and want to test them in jam-station:

1. **In the library directory (e.g., iblokz-audio):**
   ```bash
   cd /home/alexem/Projects/dev/org/iblokz/audio
   pnpm link --global
   pnpm build  # If library has a build step
   ```

2. **In jam-station directory:**
   ```bash
   cd /home/alexem/Projects/dev/music/jam-station
   pnpm link iblokz-audio  # or iblokz-data, iblokz-state, etc.
   ```

3. **To switch back to npm version:**
   ```bash
   pnpm unlink iblokz-audio
   pnpm install
   ```

**Note:** You can link multiple libraries at once. The npm versions remain the default - no extra steps needed unless you're doing local development.

## Library Usage

All `iblokz-*` libraries are used directly via npm imports:
- `iblokz-audio` - Audio utilities (VCO, VCA, VCF, ADSR, LFO, Reverb, Sampler)
- `iblokz-data` - Data utilities (obj, arr, fn, str helpers)
- `iblokz-state` - State management (createState, actions, state$)
- `iblokz-snabbdom-helpers` - Virtual DOM helpers (div, button, etc.)

No wrappers needed - import directly from the packages.

