# Audio Library Integration

This project uses `iblokz-audio` from npm as the default dependency. For local development with changes to the audio library, you can optionally link to a local version.

## Using Published npm Version (Default)

The project uses the published npm version by default:

```json
"dependencies": {
  "iblokz-audio": "^0.1.0"
}
```

Just run:
```bash
pnpm install
```

## Optional: Local Development with iblokz-audio

If you're making changes to `iblokz-audio` and want to test them in jam-station:

1. **In iblokz-audio directory:**
   ```bash
   cd /home/alexem/Projects/dev/org/iblokz/audio
   pnpm link --global
   pnpm build  # Build CommonJS version
   ```

2. **In jam-station directory:**
   ```bash
   cd /home/alexem/Projects/dev/music/jam-station
   pnpm link iblokz-audio
   ```

3. **To switch back to npm version:**
   ```bash
   pnpm unlink iblokz-audio
   pnpm install
   ```

## Audio Utilities Location

The audio utilities are wrapped in:
- `src/js/util/audio/index.js` - Main audio API wrapper
- `src/js/util/audio/sources/sampler.js` - Sampler wrapper

These files re-export from `iblokz-audio` to maintain backward compatibility with existing code.

