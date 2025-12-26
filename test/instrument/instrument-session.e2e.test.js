/**
 * Playwright E2E tests for instrument -> session interaction
 * Tests that instrument property changes are properly saved to session tracks
 */

import {test, expect} from '@playwright/test';

// Detect if we're running in headed mode
const isHeaded = process.env.HEADED === 'true';

// Screenshot counter for sequential naming
let screenshotCounter = 0;

import fs from 'fs';
import path from 'path';

/**
 * Takes a screenshot with a descriptive name (only in headed mode)
 * @param {Page} page - Playwright page object
 * @param {string} name - Descriptive name for the screenshot
 */
async function takeScreenshot(page, name) {
	if (!isHeaded) return; // Skip screenshots in headless mode
	
	// Ensure playwright-output directory exists
	const outputDir = 'playwright-output';
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, {recursive: true});
	}
	
	screenshotCounter++;
	const filename = path.join(outputDir, `test-${screenshotCounter.toString().padStart(3, '0')}-${name.replace(/\s+/g, '-').toLowerCase()}.png`);
	await page.screenshot({path: filename, fullPage: false});
	console.log(`Screenshot saved: ${filename}`);
}

/**
 * Waits for human readability (only in headed mode) or minimal wait for app processes
 * @param {Page} page - Playwright page object
 * @param {number} headedMs - Milliseconds to wait in headed mode (for human readability)
 * @param {number} headlessMs - Milliseconds to wait in headless mode (for app processes only)
 */
async function waitForReadability(page, headedMs = 1000, headlessMs = 100) {
	await page.waitForTimeout(isHeaded ? headedMs : headlessMs);
}

/**
 * Gets the current instrument state from the app
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Current instrument state
 */
async function getInstrumentState(page) {
	return await page.evaluate(() => {
		return window.__jamStationState$?.value?.instrument;
	});
}

/**
 * Gets the current session tracks state from the app
 * @param {Page} page - Playwright page object
 * @returns {Promise<Array>} Current session tracks
 */
async function getSessionTracks(page) {
	return await page.evaluate(() => {
		return window.__jamStationState$?.value?.session?.tracks;
	});
}

/**
 * Gets the current session selection from the app
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} Current session selection
 */
async function getSessionSelection(page) {
	return await page.evaluate(() => {
		return window.__jamStationState$?.value?.session?.selection;
	});
}

test.describe('Instrument -> Session Interaction', () => {
	test.beforeEach(async ({page, context, browser}) => {
		// Grant MIDI permissions before navigation to prevent permission prompts
		const baseURL = process.env.TEST_PORT 
			? `http://localhost:${process.env.TEST_PORT}` 
			: 'http://localhost:5678';
		try {
			await context.grantPermissions(['midi'], {origin: baseURL});
		} catch (e) {
			console.log('Note: MIDI permission grant attempted:', e.message);
		}
		
		// Maximize browser window
		await page.setViewportSize({width: 1920, height: 1080});
		
		// Navigate to the app
		await page.goto('/', {waitUntil: 'domcontentloaded'});
		
		// Wait for the app to load
		await page.waitForSelector('#ui', {timeout: 30000});
		
		// Wait for JavaScript to initialize
		await page.waitForFunction(() => {
			return window.__jamStationActions !== undefined && 
			       window.__jamStationState$ !== undefined;
		}, {timeout: 15000});
		
		await waitForReadability(page, 1000, 200);
		
		// Wait for layout to be constructed
		await page.waitForSelector('#layout', {timeout: 15000});
		
		// Configure layout to show only instrument and session for clearer test visibility
		await page.evaluate(() => {
			const actions = window.__jamStationActions;
			const state$ = window.__jamStationState$;
			if (actions && state$) {
				// Hide all panels except instrument and session
				const panels = ['mediaLibrary', 'pianoRoll', 'sequencer', 'midiKeyboard', 'midiMap'];
				panels.forEach(panel => {
					if (state$.value?.layout?.[panel]?.visible) {
						actions.toggle(['layout', panel, 'visible']);
					}
				});
				// Make sure instrument and session are visible
				if (!state$.value?.layout?.instrument?.visible) {
					actions.toggle(['layout', 'instrument', 'visible']);
				}
				if (!state$.value?.layout?.session?.visible) {
					actions.toggle(['layout', 'session', 'visible']);
				}
				// Expand instrument and session for better visibility
				actions.set(['layout', 'instrument', 'dim', 'height'], 600);
				actions.set(['layout', 'session', 'dim', 'height'], 400);
			}
		});
		
		await waitForReadability(page, 1000, 200);
		
		// Wait for instrument and session to be rendered
		await page.waitForSelector('.instrument', {timeout: 10000});
		await page.waitForSelector('.session', {timeout: 10000});
		
		await waitForReadability(page, 1000, 200);
	});

	test('Step 1: Visualize only instrument & session UI', async ({page}) => {
		await page.evaluate(() => { document.title = 'Step 1: Visualize Instrument & Session UI'; });
		await waitForReadability(page, 2000, 200);
		
		// Verify instrument UI is visible
		const instrument = page.locator('.instrument');
		await expect(instrument).toBeVisible();
		
		// Verify session UI is visible
		const session = page.locator('.session');
		await expect(session).toBeVisible();
		
		// Verify instrument has source section
		const sourceSection = instrument.locator('h3:has-text("Source")');
		await expect(sourceSection).toBeVisible();
		
		// Verify instrument has effects section
		const effectsSection = instrument.locator('h3:has-text("Effects")');
		await expect(effectsSection).toBeVisible();
		
		// Verify session has tracks
		const tracks = session.locator('.channel');
		const trackCount = await tracks.count();
		expect(trackCount).toBeGreaterThan(0);
		
		await takeScreenshot(page, 'step-1-instrument-session-visible');
	});

	test('Step 2: Change properties in source and effects, then verify session update', async ({page}) => {
		await page.evaluate(() => { document.title = 'Step 2: Change Instrument Properties'; });
		await waitForReadability(page, 2000, 200);
		
		// Get initial state
		const initialSelection = await getSessionSelection(page);
		const initialTracks = await getSessionTracks(page);
		const initialInstrument = await getInstrumentState(page);
		
		// Determine which track is selected
		const trackType = initialTracks[initialSelection.piano[0]]?.type || 'piano';
		const trackIndex = trackType === 'piano' ? initialSelection.piano[0] : initialSelection.seq[0];
		
		// Step 2.1: Change VCO1 type from square to sine
		const vco1SineButton = page.locator('.instrument fieldset:has(legend:has-text("VCO1")) .btn-opt').first();
		await vco1SineButton.click();
		await waitForReadability(page, 500, 100);
		
		// Verify instrument state changed
		let instrumentState = await getInstrumentState(page);
		expect(instrumentState.source.vco1.type).toBe('sine');
		
		// Verify session track was updated
		let tracks = await getSessionTracks(page);
		expect(tracks[trackIndex].inst.source.vco1.type).toBe('sine');
		
		await takeScreenshot(page, 'step-2-1-vco1-type-changed');
		
		// Step 2.2: Change VCO1 detune
		const vco1DetuneInput = page.locator('.instrument fieldset:has(legend:has-text("VCO1")) input[type="number"]');
		await vco1DetuneInput.fill('5');
		await waitForReadability(page, 500, 100);
		
		// Verify instrument state changed
		instrumentState = await getInstrumentState(page);
		expect(parseFloat(instrumentState.source.vco1.detune)).toBe(5);
		
		// Verify session track was updated
		tracks = await getSessionTracks(page);
		expect(parseFloat(tracks[trackIndex].inst.source.vco1.detune)).toBe(5);
		
		await takeScreenshot(page, 'step-2-2-vco1-detune-changed');
		
		// Step 2.3: Change VCA1 volume
		// First, make sure VCA1 is selected
		const vca1Tab = page.locator('.instrument fieldset legend span:has-text("VCA1")');
		await vca1Tab.click();
		await waitForReadability(page, 300, 100);
		
		// Find the volume range input for the active VCA
		const vcaVolumeInput = page.locator('.instrument fieldset:has(legend:has-text("VCA1")) input[type="range"]').last();
		await vcaVolumeInput.fill('0.75');
		await waitForReadability(page, 500, 100);
		
		// Verify instrument state changed
		instrumentState = await getInstrumentState(page);
		const vcaOn = instrumentState.source.vcaOn;
		expect(parseFloat(instrumentState.source[`vca${vcaOn}`].volume)).toBeCloseTo(0.75, 2);
		
		// Verify session track was updated
		tracks = await getSessionTracks(page);
		expect(parseFloat(tracks[trackIndex].inst.source[`vca${vcaOn}`].volume)).toBeCloseTo(0.75, 2);
		
		await takeScreenshot(page, 'step-2-3-vca-volume-changed');
		
		// Step 2.4: Change VCF cutoff (first effect in chain)
		// Expand VCF if not expanded
		const vcfExpandButton = page.locator('.instrument fieldset:has(legend:has-text("VCF")) legend span.on').first();
		const isVcfExpanded = await page.evaluate((el) => {
			const fieldset = el.closest('fieldset');
			return fieldset && fieldset.querySelector('div:has(input[type="range"])') !== null;
		}, await vcfExpandButton.elementHandle());
		
		if (!isVcfExpanded) {
			await vcfExpandButton.click();
			await waitForReadability(page, 300, 100);
		}
		
		// Find and change VCF cutoff
		const vcfCutoffInput = page.locator('.instrument fieldset:has(legend:has-text("VCF")) input[type="range"]').first();
		await vcfCutoffInput.fill('0.85');
		await waitForReadability(page, 500, 100);
		
		// Verify instrument state changed
		instrumentState = await getInstrumentState(page);
		const vcfEffect = instrumentState.effectsChain.find(e => e.type === 'vcf');
		expect(vcfEffect).toBeDefined();
		expect(parseFloat(vcfEffect.cutoff)).toBeCloseTo(0.85, 2);
		
		// Verify session track was updated
		tracks = await getSessionTracks(page);
		const trackVcfEffect = tracks[trackIndex].inst.effectsChain.find(e => e.type === 'vcf');
		expect(trackVcfEffect).toBeDefined();
		expect(parseFloat(trackVcfEffect.cutoff)).toBeCloseTo(0.85, 2);
		
		await takeScreenshot(page, 'step-2-4-vcf-cutoff-changed');
		
		// Step 2.5: Change Reverb wet
		// Expand Reverb if not expanded
		const reverbExpandButton = page.locator('.instrument fieldset:has(legend:has-text("REVERB")) legend span.on').first();
		const isReverbExpanded = await page.evaluate((el) => {
			const fieldset = el.closest('fieldset');
			return fieldset && fieldset.querySelector('div:has(input[type="range"])') !== null;
		}, await reverbExpandButton.elementHandle());
		
		if (!isReverbExpanded) {
			await reverbExpandButton.click();
			await waitForReadability(page, 300, 100);
		}
		
		// Find and change Reverb wet (last range input in reverb section)
		const reverbWetInput = page.locator('.instrument fieldset:has(legend:has-text("REVERB")) input[type="range"]').last();
		await reverbWetInput.fill('0.9');
		await waitForReadability(page, 500, 100);
		
		// Verify instrument state changed
		instrumentState = await getInstrumentState(page);
		const reverbEffect = instrumentState.effectsChain.find(e => e.type === 'reverb');
		expect(reverbEffect).toBeDefined();
		expect(parseFloat(reverbEffect.wet)).toBeCloseTo(0.9, 2);
		
		// Verify session track was updated
		tracks = await getSessionTracks(page);
		const trackReverbEffect = tracks[trackIndex].inst.effectsChain.find(e => e.type === 'reverb');
		expect(trackReverbEffect).toBeDefined();
		expect(parseFloat(trackReverbEffect.wet)).toBeCloseTo(0.9, 2);
		
		await takeScreenshot(page, 'step-2-5-reverb-wet-changed');
	});

	test('Step 3: Change track/channel and verify new track loads', async ({page}) => {
		await page.evaluate(() => { document.title = 'Step 3: Change Track/Channel'; });
		await waitForReadability(page, 2000, 200);
		
		// Get initial state
		const initialSelection = await getSessionSelection(page);
		const initialTracks = await getSessionTracks(page);
		const initialTrackIndex = initialSelection.piano[0];
		
		// Store the instrument state of the first track
		const firstTrackInstrument = JSON.parse(JSON.stringify(initialTracks[initialTrackIndex].inst));
		
		// Step 3.1: Click on a different track (second piano track, row 0)
		// Find a different track to select
		let targetTrackIndex = null;
		for (let i = 0; i < initialTracks.length; i++) {
			if (i !== initialTrackIndex && initialTracks[i].type === 'piano') {
				targetTrackIndex = i;
				break;
			}
		}
		
		if (targetTrackIndex === null) {
			// If no other piano track, use the first seq track
			for (let i = 0; i < initialTracks.length; i++) {
				if (initialTracks[i].type === 'seq') {
					targetTrackIndex = i;
					break;
				}
			}
		}
		
		expect(targetTrackIndex).not.toBeNull();
		
		// Click on the target track, row 0
		const targetTrackRow = page.locator(`.session .channel:nth-child(${targetTrackIndex + 1}) .track li:nth-child(2)`);
		await targetTrackRow.click();
		await waitForReadability(page, 1000, 200);
		
		// Verify selection changed
		const newSelection = await getSessionSelection(page);
		const trackType = initialTracks[targetTrackIndex].type;
		if (trackType === 'piano') {
			expect(newSelection.piano[0]).toBe(targetTrackIndex);
		} else {
			expect(newSelection.seq[0]).toBe(targetTrackIndex);
		}
		
		// Verify instrument state loaded from the new track
		const newInstrumentState = await getInstrumentState(page);
		const newTracks = await getSessionTracks(page);
		const newTrackInstrument = newTracks[targetTrackIndex].inst;
		
		// The instrument state should match the new track's instrument
		expect(JSON.stringify(newInstrumentState)).toBe(JSON.stringify(newTrackInstrument));
		
		await takeScreenshot(page, 'step-3-track-changed');
		
		// Step 3.2: Verify the first track's instrument state was preserved
		const updatedTracks = await getSessionTracks(page);
		const preservedFirstTrackInstrument = updatedTracks[initialTrackIndex].inst;
		
		// Verify all our changes are still there
		expect(preservedFirstTrackInstrument.source.vco1.type).toBe('sine');
		expect(parseFloat(preservedFirstTrackInstrument.source.vco1.detune)).toBe(5);
		expect(parseFloat(preservedFirstTrackInstrument.source[`vca${firstTrackInstrument.source.vcaOn}`].volume)).toBeCloseTo(0.75, 2);
		
		const preservedVcf = preservedFirstTrackInstrument.effectsChain.find(e => e.type === 'vcf');
		expect(preservedVcf).toBeDefined();
		expect(parseFloat(preservedVcf.cutoff)).toBeCloseTo(0.85, 2);
		
		const preservedReverb = preservedFirstTrackInstrument.effectsChain.find(e => e.type === 'reverb');
		expect(preservedReverb).toBeDefined();
		expect(parseFloat(preservedReverb.wet)).toBeCloseTo(0.9, 2);
	});

	test('Step 4: Change back to first track/channel and verify state is restored', async ({page}) => {
		await page.evaluate(() => { document.title = 'Step 4: Return to First Track'; });
		await waitForReadability(page, 2000, 200);
		
		// Get initial state
		const initialSelection = await getSessionSelection(page);
		const initialTracks = await getSessionTracks(page);
		const firstTrackIndex = initialSelection.piano[0];
		const firstTrackType = initialTracks[firstTrackIndex].type;
		
		// Step 4.1: Make some changes to verify they're saved
		// Change VCO1 type
		const vco1SquareButton = page.locator('.instrument fieldset:has(legend:has-text("VCO1")) .btn-opt').nth(1);
		await vco1SquareButton.click();
		await waitForReadability(page, 500, 100);
		
		// Change VCO1 detune
		const vco1DetuneInput = page.locator('.instrument fieldset:has(legend:has-text("VCO1")) input[type="number"]');
		await vco1DetuneInput.fill('10');
		await waitForReadability(page, 500, 100);
		
		// Store the modified state
		const modifiedInstrument = await getInstrumentState(page);
		
		// Step 4.2: Switch to a different track
		let targetTrackIndex = null;
		for (let i = 0; i < initialTracks.length; i++) {
			if (i !== firstTrackIndex && initialTracks[i].type === firstTrackType) {
				targetTrackIndex = i;
				break;
			}
		}
		
		if (targetTrackIndex === null) {
			// If no other track of same type, use any other track
			for (let i = 0; i < initialTracks.length; i++) {
				if (i !== firstTrackIndex) {
					targetTrackIndex = i;
					break;
				}
			}
		}
		
		expect(targetTrackIndex).not.toBeNull();
		
		// Click on the target track
		const targetTrackRow = page.locator(`.session .channel:nth-child(${targetTrackIndex + 1}) .track li:nth-child(2)`);
		await targetTrackRow.click();
		await waitForReadability(page, 1000, 200);
		
		// Verify we switched tracks
		const midSelection = await getSessionSelection(page);
		const midTracks = await getSessionTracks(page);
		const midTrackType = midTracks[targetTrackIndex].type;
		if (midTrackType === 'piano') {
			expect(midSelection.piano[0]).toBe(targetTrackIndex);
		} else {
			expect(midSelection.seq[0]).toBe(targetTrackIndex);
		}
		
		// Verify first track's state was saved
		const savedFirstTrackInstrument = midTracks[firstTrackIndex].inst;
		expect(savedFirstTrackInstrument.source.vco1.type).toBe(modifiedInstrument.source.vco1.type);
		expect(parseFloat(savedFirstTrackInstrument.source.vco1.detune)).toBe(parseFloat(modifiedInstrument.source.vco1.detune));
		
		await takeScreenshot(page, 'step-4-1-switched-to-different-track');
		
		// Step 4.3: Switch back to the first track
		const firstTrackRow = page.locator(`.session .channel:nth-child(${firstTrackIndex + 1}) .track li:nth-child(2)`);
		await firstTrackRow.click();
		await waitForReadability(page, 1000, 200);
		
		// Verify selection is back to first track
		const finalSelection = await getSessionSelection(page);
		if (firstTrackType === 'piano') {
			expect(finalSelection.piano[0]).toBe(firstTrackIndex);
		} else {
			expect(finalSelection.seq[0]).toBe(firstTrackIndex);
		}
		
		// Verify instrument state is restored from the track
		const restoredInstrument = await getInstrumentState(page);
		const finalTracks = await getSessionTracks(page);
		const restoredTrackInstrument = finalTracks[firstTrackIndex].inst;
		
		// The instrument state should match what we saved
		expect(restoredInstrument.source.vco1.type).toBe(savedFirstTrackInstrument.source.vco1.type);
		expect(parseFloat(restoredInstrument.source.vco1.detune)).toBe(parseFloat(savedFirstTrackInstrument.source.vco1.detune));
		
		// Verify all previous changes are still there
		expect(restoredTrackInstrument.source.vco1.type).toBe(modifiedInstrument.source.vco1.type);
		expect(parseFloat(restoredTrackInstrument.source.vco1.detune)).toBe(parseFloat(modifiedInstrument.source.vco1.detune));
		
		await takeScreenshot(page, 'step-4-2-returned-to-first-track');
	});

	test('Complete flow: Change props -> Switch tracks -> Return and verify', async ({page}) => {
		await page.evaluate(() => { document.title = 'Complete Flow Test'; });
		await waitForReadability(page, 2000, 200);
		
		// Get initial state
		const initialSelection = await getSessionSelection(page);
		const initialTracks = await getSessionTracks(page);
		const firstTrackIndex = initialSelection.piano[0];
		
		// Step 1: Make changes to first track
		// Change VCO1 to triangle
		const vco1TriangleButton = page.locator('.instrument fieldset:has(legend:has-text("VCO1")) .btn-opt').last();
		await vco1TriangleButton.click();
		await waitForReadability(page, 500, 100);
		
		// Change VCO1 detune to 15
		const vco1DetuneInput = page.locator('.instrument fieldset:has(legend:has-text("VCO1")) input[type="number"]');
		await vco1DetuneInput.fill('15');
		await waitForReadability(page, 500, 100);
		
		// Change VCA volume to 0.6
		const vca1Tab = page.locator('.instrument fieldset legend span:has-text("VCA1")');
		await vca1Tab.click();
		await waitForReadability(page, 300, 100);
		const vcaVolumeInput = page.locator('.instrument fieldset:has(legend:has-text("VCA1")) input[type="range"]').last();
		await vcaVolumeInput.fill('0.6');
		await waitForReadability(page, 500, 100);
		
		// Change VCF cutoff to 0.7
		const vcfExpandButton = page.locator('.instrument fieldset:has(legend:has-text("VCF")) legend span.on').first();
		const isVcfExpanded = await page.evaluate((el) => {
			const fieldset = el.closest('fieldset');
			return fieldset && fieldset.querySelector('div:has(input[type="range"])') !== null;
		}, await vcfExpandButton.elementHandle());
		if (!isVcfExpanded) {
			await vcfExpandButton.click();
			await waitForReadability(page, 300, 100);
		}
		const vcfCutoffInput = page.locator('.instrument fieldset:has(legend:has-text("VCF")) input[type="range"]').first();
		await vcfCutoffInput.fill('0.7');
		await waitForReadability(page, 500, 100);
		
		// Store the changes
		const firstTrackChanges = await getInstrumentState(page);
		
		// Step 2: Switch to second track
		let secondTrackIndex = null;
		for (let i = 0; i < initialTracks.length; i++) {
			if (i !== firstTrackIndex && initialTracks[i].type === 'piano') {
				secondTrackIndex = i;
				break;
			}
		}
		
		if (secondTrackIndex === null) {
			for (let i = 0; i < initialTracks.length; i++) {
				if (i !== firstTrackIndex) {
					secondTrackIndex = i;
					break;
				}
			}
		}
		
		expect(secondTrackIndex).not.toBeNull();
		
		const secondTrackRow = page.locator(`.session .channel:nth-child(${secondTrackIndex + 1}) .track li:nth-child(2)`);
		await secondTrackRow.click();
		await waitForReadability(page, 1000, 200);
		
		// Verify first track's changes were saved
		const midTracks = await getSessionTracks(page);
		const savedFirstTrack = midTracks[firstTrackIndex].inst;
		expect(savedFirstTrack.source.vco1.type).toBe(firstTrackChanges.source.vco1.type);
		expect(parseFloat(savedFirstTrack.source.vco1.detune)).toBe(parseFloat(firstTrackChanges.source.vco1.detune));
		
		// Step 3: Make changes to second track
		const secondTrackVco1SquareButton = page.locator('.instrument fieldset:has(legend:has-text("VCO1")) .btn-opt').nth(1);
		await secondTrackVco1SquareButton.click();
		await waitForReadability(page, 500, 100);
		
		const secondTrackChanges = await getInstrumentState(page);
		
		// Step 4: Return to first track
		const firstTrackRow = page.locator(`.session .channel:nth-child(${firstTrackIndex + 1}) .track li:nth-child(2)`);
		await firstTrackRow.click();
		await waitForReadability(page, 1000, 200);
		
		// Verify first track's state is restored
		const finalInstrument = await getInstrumentState(page);
		expect(finalInstrument.source.vco1.type).toBe(firstTrackChanges.source.vco1.type);
		expect(parseFloat(finalInstrument.source.vco1.detune)).toBe(parseFloat(firstTrackChanges.source.vco1.detune));
		
		// Verify second track's changes were saved
		const finalTracks = await getSessionTracks(page);
		const savedSecondTrack = finalTracks[secondTrackIndex].inst;
		expect(savedSecondTrack.source.vco1.type).toBe(secondTrackChanges.source.vco1.type);
		
		await takeScreenshot(page, 'complete-flow-verified');
	});
});

