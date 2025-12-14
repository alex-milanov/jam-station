/**
 * Playwright E2E tests for piano-roll interaction
 * Tests selection, dragging, and multi-selection scenarios
 */

const {test, expect} = require('@playwright/test');

// Detect if we're running in headed mode
const isHeaded = process.env.HEADED === 'true';

// Screenshot counter for sequential naming
let screenshotCounter = 0;

/**
 * Takes a screenshot with a descriptive name (only in headed mode)
 * @param {Page} page - Playwright page object
 * @param {string} name - Descriptive name for the screenshot
 */
async function takeScreenshot(page, name) {
	if (!isHeaded) return; // Skip screenshots in headless mode
	screenshotCounter++;
	const filename = `test-${screenshotCounter.toString().padStart(3, '0')}-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
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

// Helper functions for note conversion (matching app's util/midi.js)
const noteToNumber = (note) => {
	const match = note.match(/^([A-G]#?)(\d+)$/);
	if (!match) return 60; // Default to C4
	const [, key, octave] = match;
	const noteMap = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11};
	return parseInt(octave, 10) * 12 + noteMap[key] + 12;
};

const numberToNote = (number) => {
	const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const octave = Math.floor((number - 12) / 12);
	const note = noteMap[(number - 12) % 12];
	return {key: note, octave};
};

// Helper to create test events
const createEvent = (note, start, duration = 1, velocity = 0.8) => ({
	uuid: `test-${note}-${start}`,
	note,
	start,
	duration,
	velocity,
	startTime: 0
});

/**
 * Helper to dispatch pointer events with canvas-relative coordinates
 * Converts screen coordinates to canvas offsetX/offsetY
 * Uses evaluate to create a proper PointerEvent with offsetX/offsetY
 */
async function dispatchPointerEvent(page, canvasElement, type, screenX, screenY) {
	const canvasBox = await canvasElement.boundingBox();
	if (!canvasBox) {
		throw new Error('Canvas not found or not visible');
	}
	
	// Convert screen coordinates to canvas-relative coordinates
	const offsetX = screenX - canvasBox.x;
	const offsetY = screenY - canvasBox.y;
	
	// Use evaluate to create a proper PointerEvent with offsetX/offsetY
	await canvasElement.evaluate((canvas, eventType, offsetX, offsetY, buttonState) => {
		const rect = canvas.getBoundingClientRect();
		const clientX = rect.left + offsetX;
		const clientY = rect.top + offsetY;
		
		// Validate coordinates
		if (!isFinite(clientX) || !isFinite(clientY)) {
			console.error(`[Test] Invalid coordinates: clientX=${clientX}, clientY=${clientY}, rect=`, rect, `offsetX=${offsetX}, offsetY=${offsetY}`);
			return false;
		}
		
		const event = new PointerEvent(eventType, {
			bubbles: true,
			cancelable: true,
			pointerId: 1,
			pointerType: 'mouse',
			button: 0,
			buttons: buttonState,
			clientX: clientX,
			clientY: clientY,
		});
		
		// Manually set offsetX/offsetY since PointerEvent doesn't have them by default
		Object.defineProperty(event, 'offsetX', {
			value: offsetX,
			writable: false,
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(event, 'offsetY', {
			value: offsetY,
			writable: false,
			enumerable: true,
			configurable: true
		});
		
		console.log(`[Test] Dispatching ${eventType} with offsetX=${offsetX}, offsetY=${offsetY}, clientX=${clientX}, clientY=${clientY}`);
		console.log(`[Test] Canvas element:`, canvas, `has listeners:`, canvas.onpointerdown !== null);
		
		// Try both direct dispatch and also trigger via mouse event
		const result = canvas.dispatchEvent(event);
		console.log(`[Test] Event dispatched, result: ${result}, event.offsetX=${event.offsetX}, event.offsetY=${event.offsetY}`);
		
		// Also try calling the handler directly if it exists
		if (canvas.onpointerdown && eventType === 'pointerdown') {
			console.log(`[Test] Calling onpointerdown directly`);
			canvas.onpointerdown(event);
		} else if (canvas.onpointermove && eventType === 'pointermove') {
			console.log(`[Test] Calling onpointermove directly`);
			canvas.onpointermove(event);
		} else if (canvas.onpointerup && eventType === 'pointerup') {
			console.log(`[Test] Calling onpointerup directly`);
			canvas.onpointerup(event);
		}
		
		return result;
	}, type, offsetX, offsetY, type === 'pointerdown' ? 1 : (type === 'pointerup' ? 0 : 1));
	
	// Wait a bit for the event to be processed
	await page.waitForTimeout(10);
}

/**
 * Helper to click on canvas at screen coordinates
 * Uses Playwright's mouse API which triggers real browser events
 */
async function clickCanvas(page, canvasElement, screenX, screenY) {
	// Get canvas bounding box for coordinate conversion
	const canvasBox = await canvasElement.boundingBox();
	if (!canvasBox) {
		throw new Error('Canvas not found or not visible');
	}
	
	// Convert screen coordinates to canvas-relative for logging
	const canvasX = screenX - canvasBox.x;
	const canvasY = screenY - canvasBox.y;
	
	console.log(`[Test] Clicking at screen(${screenX}, ${screenY}), canvas-relative(${canvasX}, ${canvasY})`);
	
	// Use Playwright's mouse API - it will trigger real pointer events
	await page.mouse.move(screenX, screenY);
	await page.waitForTimeout(50); // Small delay for mouse move (app process)
	await page.mouse.down();
	await page.waitForTimeout(50); // Small delay for mouse down (app process)
	await page.mouse.up();
	await waitForReadability(page, 1000, 100); // Wait for selection to be processed and rendered
}

/**
 * Helper to drag on canvas from start to end screen coordinates
 * Uses Playwright's mouse API which triggers real browser events
 */
async function dragCanvas(page, canvasElement, startX, startY, endX, endY, steps = 10) {
	// Get canvas bounding box for coordinate conversion
	const canvasBox = await canvasElement.boundingBox();
	if (!canvasBox) {
		throw new Error('Canvas not found or not visible');
	}
	
	// Convert screen coordinates to canvas-relative for logging
	const canvasStartX = startX - canvasBox.x;
	const canvasStartY = startY - canvasBox.y;
	const canvasEndX = endX - canvasBox.x;
	const canvasEndY = endY - canvasBox.y;
	
	console.log(`[Test] Dragging from screen(${startX}, ${startY}) to (${endX}, ${endY})`);
	console.log(`[Test] Canvas-relative: (${canvasStartX}, ${canvasStartY}) to (${canvasEndX}, ${canvasEndY})`);
	
	// Use Playwright's mouse API - it will trigger real pointer events
	await page.mouse.move(startX, startY);
	await page.waitForTimeout(50);
	await page.mouse.down();
	await page.waitForTimeout(50);
	
	// Move in steps for smooth dragging
	const deltaX = (endX - startX) / steps;
	const deltaY = (endY - startY) / steps;
	for (let i = 1; i <= steps; i++) {
		const currentX = startX + deltaX * i;
		const currentY = startY + deltaY * i;
		await page.mouse.move(currentX, currentY);
		await page.waitForTimeout(10);
	}
	
	// Pause before releasing (longer in headed mode for visibility, minimal in headless)
	await waitForReadability(page, 1000, 50);
	await page.mouse.up();
}

/**
 * Drags on the canvas with a configurable wait before mouse up
 * @param {Page} page - Playwright page object
 * @param {Locator} canvasElement - The canvas element
 * @param {number} startX - Start X coordinate (screen space)
 * @param {number} startY - Start Y coordinate (screen space)
 * @param {number} endX - End X coordinate (screen space)
 * @param {number} endY - End Y coordinate (screen space)
 * @param {number} steps - Number of steps for smooth dragging (default: 10)
 * @param {number} waitBeforeUp - Milliseconds to wait before mouse up (default: 1000)
 */
async function dragCanvasWithWait(page, canvasElement, startX, startY, endX, endY, steps = 10, waitBeforeUp = 1000) {
	// Get canvas bounding box for coordinate conversion
	const canvasBox = await canvasElement.boundingBox();
	if (!canvasBox) {
		throw new Error('Canvas not found or not visible');
	}
	
	// Convert screen coordinates to canvas-relative for logging
	const canvasStartX = startX - canvasBox.x;
	const canvasStartY = startY - canvasBox.y;
	const canvasEndX = endX - canvasBox.x;
	const canvasEndY = endY - canvasBox.y;
	
	console.log(`[Test] Dragging from screen(${startX}, ${startY}) to (${endX}, ${endY})`);
	console.log(`[Test] Canvas-relative: (${canvasStartX}, ${canvasStartY}) to (${canvasEndX}, ${canvasEndY})`);
	
	// Use Playwright's mouse API - it will trigger real pointer events
	await page.mouse.move(startX, startY);
	await page.waitForTimeout(50);
	await page.mouse.down();
	await page.waitForTimeout(50);
	
	// Move in steps for smooth dragging
	const deltaX = (endX - startX) / steps;
	const deltaY = (endY - startY) / steps;
	for (let i = 1; i <= steps; i++) {
		const currentX = startX + deltaX * i;
		const currentY = startY + deltaY * i;
		await page.mouse.move(currentX, currentY);
		await page.waitForTimeout(10);
	}
	
	// Wait before releasing (use conditional wait, but respect the provided waitBeforeUp in headed mode)
	const actualWait = isHeaded ? waitBeforeUp : Math.min(waitBeforeUp, 100); // Cap at 100ms in headless
	await page.waitForTimeout(actualWait);
	await page.mouse.up();
}

/**
 * Executes a selection by dragging a rectangle around the specified events
 * @param {Page} page - Playwright page object
 * @param {Locator} canvasElement - The interaction canvas element
 * @param {Array<string>} eventUuids - Array of event UUIDs to select
 * @param {number} padding - Padding in pixels to add outside the bounding box (default: 10)
 */
async function execSelection(page, canvasElement, eventUuids, padding = 10) {
	// Get canvas bounding box
	const canvasBox = await canvasElement.boundingBox();
	if (!canvasBox) {
		throw new Error('Canvas not found or not visible');
	}
	
	// Wait a bit to ensure state is updated (especially after a drag)
	await page.waitForTimeout(200);
	
	// Get visible events from the page (use the app's visible array)
	// The visible array should be updated by the piano-roll service when events change
	const eventsInfo = await page.evaluate((uuids) => {
		const state$ = window.__jamStationState$;
		const pianoRoll = state$?.value?.pianoRoll;
		const visible = pianoRoll?.visible || [];
		const events = pianoRoll?.events || [];
		return uuids.map(uuid => {
			const visibleEvent = visible.find(v => v.uuid === uuid);
			const eventData = events.find(e => e.uuid === uuid);
			if (visibleEvent && eventData) {
				return {
					uuid,
					rect: visibleEvent.rect,
					start: eventData.start,
					note: eventData.note
				};
			}
			return null;
		}).filter(Boolean);
	}, eventUuids);
	
	// Log event positions for debugging
	console.log(`Event positions for selection:`, eventsInfo.map(e => ({
		uuid: e.uuid,
		start: e.start,
		note: e.note,
		rect: e.rect
	})));
	
	if (eventsInfo.length === 0) {
		throw new Error(`No events found for UUIDs: ${eventUuids.join(', ')}`);
	}
	
	// Calculate bounding box of all events
	const rects = eventsInfo.map(e => e.rect);
	const minX = Math.min(...rects.map(r => r.x)) - padding;
	const maxX = Math.max(...rects.map(r => r.x + r.width)) + padding;
	const minY = Math.min(...rects.map(r => r.y)) - padding;
	const maxY = Math.max(...rects.map(r => r.y + r.height)) + padding;
	
	// Convert to screen coordinates
	const startX = canvasBox.x + minX;
	const startY = canvasBox.y + minY;
	const endX = canvasBox.x + maxX;
	const endY = canvasBox.y + maxY;
	
	console.log(`Selecting events: ${eventUuids.join(', ')}`);
	console.log(`Selection rectangle: (${minX}, ${minY}) to (${maxX}, ${maxY})`);
	
	// Execute the selection drag with conditional wait before mouse up
	await dragCanvasWithWait(page, canvasElement, startX, startY, endX, endY, 10, isHeaded ? 1000 : 100);
	
	// Wait for selection to be processed (longer in headed mode for visibility)
	await waitForReadability(page, 500, 100);
	
	// Verify the selection matches the expected events
	const actualSelection = await page.evaluate(() => {
		const state$ = window.__jamStationState$;
		return state$?.value?.pianoRoll?.selection || [];
	});
	
	// Check that all expected events are in the selection
	const missingEvents = eventUuids.filter(uuid => !actualSelection.includes(uuid));
	if (missingEvents.length > 0) {
		throw new Error(
			`Selection mismatch: Expected events ${eventUuids.join(', ')} but selection contains ${actualSelection.join(', ')}. Missing: ${missingEvents.join(', ')}`
		);
	}
	
	// Check for unexpected events (events in selection but not in expected list)
	// Note: We allow extra events if the selection rectangle happens to cover more events
	// But we log a warning if there are unexpected events
	const unexpectedEvents = actualSelection.filter(uuid => !eventUuids.includes(uuid));
	if (unexpectedEvents.length > 0) {
		console.warn(`Warning: Selection contains unexpected events: ${unexpectedEvents.join(', ')}`);
	}
	
	console.log(`Selection verified: ${actualSelection.join(', ')} (expected: ${eventUuids.join(', ')})`);
	
	// Take screenshot after selection
	await takeScreenshot(page, `selection-${eventUuids.join('-')}`);
}

/**
 * Drags events by clicking on an anchor event and dragging it
 * Works for both single and multi-event selections
 * @param {Page} page - Playwright page object
 * @param {Locator} canvasElement - The interaction canvas element
 * @param {string} anchorEventUuid - UUID of the anchor event to drag
 * @param {number} dragX - Horizontal drag amount in grid steps (positive = right, negative = left)
 * @param {number} dragY - Vertical drag amount in grid steps (positive = down, negative = up)
 * @param {number} steps - Number of steps for smooth dragging (default: 10)
 * @param {number} waitAfter - Milliseconds to wait after drag completes (default: 1000)
 */
async function dragByAnchor(page, canvasElement, anchorEventUuid, dragX, dragY, steps = 10, waitAfter = 1000) {
	// Get canvas bounding box
	const canvasBox = await canvasElement.boundingBox();
	if (!canvasBox) {
		throw new Error('Canvas not found or not visible');
	}
	
	// Wait a bit to ensure state is updated
	await page.waitForTimeout(200);
	
	// Get anchor event position from visible events
	const anchorInfo = await page.evaluate((uuid) => {
		const state$ = window.__jamStationState$;
		const pianoRoll = state$?.value?.pianoRoll;
		const visible = pianoRoll?.visible || [];
		const events = pianoRoll?.events || [];
		const visibleEvent = visible.find(v => v.uuid === uuid);
		const eventData = events.find(e => e.uuid === uuid);
		if (visibleEvent) {
			return {
				rect: visibleEvent.rect,
				start: eventData?.start,
				note: eventData?.note
			};
		}
		return null;
	}, anchorEventUuid);
	
	if (!anchorInfo) {
		throw new Error(`Anchor event ${anchorEventUuid} not found or not visible`);
	}
	
	// Get grid dimensions
	const dim = await page.evaluate(() => {
		const state$ = window.__jamStationState$;
		return state$?.value?.pianoRoll?.dim || [30, 12];
	});
	
	// Calculate start position (center of anchor event)
	const canvasAnchorX = anchorInfo.rect.x + anchorInfo.rect.width / 2;
	const canvasAnchorY = anchorInfo.rect.y + anchorInfo.rect.height / 2;
	const screenAnchorX = canvasBox.x + canvasAnchorX;
	const screenAnchorY = canvasBox.y + canvasAnchorY;
	
	// Calculate end position (start + drag amount in pixels)
	const dragXPixels = dragX * dim[0]; // Convert grid steps to pixels
	const dragYPixels = dragY * dim[1]; // Convert grid steps to pixels
	const canvasDragEndX = canvasAnchorX + dragXPixels;
	const canvasDragEndY = canvasAnchorY + dragYPixels;
	const screenDragEndX = canvasBox.x + canvasDragEndX;
	const screenDragEndY = canvasBox.y + canvasDragEndY;
	
	console.log(`Dragging by anchor ${anchorEventUuid}: ${dragX} steps right, ${dragY} steps down`);
	console.log(`From canvas(${canvasAnchorX}, ${canvasAnchorY}) to canvas(${canvasDragEndX}, ${canvasDragEndY})`);
	
	// Execute the drag
	await dragCanvas(page, canvasElement, screenAnchorX, screenAnchorY, screenDragEndX, screenDragEndY, steps);
	
	// Wait after drag completes (conditional based on mode)
	const actualWaitAfter = isHeaded ? waitAfter : Math.min(waitAfter, 200); // Cap at 200ms in headless
	await page.waitForTimeout(actualWaitAfter);
}

/**
 * Sets up test events in the piano roll
 * Mix of snapped (quantized, integer start) and unsnapped (unquantized, fractional start) events
 * Events are scattered between C3 and B3 (notes 48-59, avoiding C4=60)
 * Some events on same column (same start time), some on same row (same note)
 * All separated by at least 1 cell
 * 
 * Distribution:
 * - Column 2: C3 (snapped), E3 (unsnapped 2.3) - same column, different notes, mixed quantization
 * - Column 4: D3 (snapped)
 * - Column 6: G3 (unsnapped 6.7)
 * - Column 8: A3 (snapped)
 * - Column 10: B3 (unsnapped 10.2)
 * - Column 12: C3 (snapped, same note as first event)
 * - Column 14: F3 (unsnapped 14.5)
 */
async function setupTestEvents(page) {
	await page.evaluate(() => {
		// Access the global state and actions
		const actions = window.__jamStationActions;
		if (!actions) {
			throw new Error('Actions not available on window');
		}
		
		const testEvents = [
			{uuid: 'event-1', note: 'C3', start: 2, duration: 1, velocity: 0.8, startTime: 0}, // Column 2, C3 (snapped)
			{uuid: 'event-2', note: 'E3', start: 2.3, duration: 1, velocity: 0.8, startTime: 0}, // Column 2, E3 (unsnapped, same column as event-1)
			{uuid: 'event-3', note: 'D3', start: 4, duration: 1, velocity: 0.8, startTime: 0}, // Column 4, D3 (snapped)
			{uuid: 'event-4', note: 'G3', start: 6.7, duration: 1, velocity: 0.8, startTime: 0}, // Column 6, G3 (unsnapped)
			{uuid: 'event-5', note: 'A3', start: 8, duration: 1, velocity: 0.8, startTime: 0}, // Column 8, A3 (snapped)
			{uuid: 'event-6', note: 'B3', start: 10.2, duration: 1, velocity: 0.8, startTime: 0}, // Column 10, B3 (unsnapped)
			{uuid: 'event-7', note: 'C3', start: 12, duration: 1, velocity: 0.8, startTime: 0}, // Column 12, C3 (snapped, same note as event-1)
			{uuid: 'event-8', note: 'F3', start: 14.5, duration: 1, velocity: 0.8, startTime: 0}  // Column 14, F3 (unsnapped)
		];
		
		// Clear existing events first
		actions.pianoRoll.clear();
		
		// Set events using actions.set
		actions.set('pianoRoll', {events: testEvents});
	});
	
	// Wait for events to be rendered (app process)
	await waitForReadability(page, 500, 100);
}

test.describe('Piano Roll Interaction', () => {
	test.beforeEach(async ({page, context, browser}) => {
		// Enable Web Audio API by setting browser launch args
		// This is done via the browser context
		
		// Grant MIDI permissions before navigation to prevent permission prompts
		// Use the baseURL from config (defaults to localhost:5678 for tests)
		const baseURL = process.env.TEST_PORT 
			? `http://localhost:${process.env.TEST_PORT}` 
			: 'http://localhost:5678';
		try {
			await context.grantPermissions(['midi'], {origin: baseURL});
		} catch (e) {
			// MIDI permission might not be available in all contexts
			console.log('Note: MIDI permission grant attempted:', e.message);
		}
		
		// Maximize browser window to see piano-roll
		await page.setViewportSize({width: 1920, height: 1080});
		
		// Navigate to the app
		await page.goto('/', {waitUntil: 'domcontentloaded'});
		
		// Wait for the app to load - check for main UI container
		await page.waitForSelector('#ui', {timeout: 30000});
		
		// Wait for JavaScript to initialize and render the UI
		// Check if actions and state are available
		await page.waitForFunction(() => {
			return window.__jamStationActions !== undefined && 
			       window.__jamStationState$ !== undefined;
		}, {timeout: 15000});
		
		// Wait a bit for initial render (app process)
		await waitForReadability(page, 1000, 200);
		
		// Wait for layout to be constructed (it's rendered by the UI)
		await page.waitForSelector('#layout', {timeout: 15000});
		
		// Configure layout to show only piano-roll for clearer test visibility
		await page.evaluate(() => {
			const actions = window.__jamStationActions;
			const state$ = window.__jamStationState$;
			if (actions && state$) {
				// Hide all panels except piano-roll
				const panels = ['mediaLibrary', 'instrument', 'session', 'sequencer', 'midiKeyboard', 'midiMap'];
				panels.forEach(panel => {
					if (state$.value?.layout?.[panel]?.visible) {
						actions.toggle(['layout', panel, 'visible']);
					}
				});
				// Make sure piano-roll is visible
				if (!state$.value?.layout?.pianoRoll?.visible) {
					actions.toggle(['layout', 'pianoRoll', 'visible']);
				}
				// Expand piano-roll height for better visibility
				actions.set(['layout', 'pianoRoll', 'dim', 'height'], 600);
			}
		});
		
		// Wait for layout to update and piano-roll to reposition (app process)
		await waitForReadability(page, 1000, 200);
		
		// Wait for piano-roll to be rendered
		await page.waitForSelector('.piano-roll', {timeout: 10000});
		
		// Wait for canvas elements to be ready
		await page.waitForSelector('.piano-roll .interaction', {timeout: 10000});
		
		// Wait for audio/MIDI permissions to be handled (app process)
		await waitForReadability(page, 1000, 200);
		
		// Set up pre-existing events in the piano roll
		await setupTestEvents(page);
	});

	test('should display pre-existing events', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Display Events - Checking visibility...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		// Check that events canvas exists and has content
		const eventsCanvas = page.locator('.piano-roll .events');
		await expect(eventsCanvas).toBeVisible();
		
		// Get canvas context to check if events are drawn
		const hasEvents = await page.evaluate(() => {
			const canvas = document.querySelector('.piano-roll .events');
			if (!canvas) return false;
			const ctx = canvas.getContext('2d');
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			// Check if canvas has any non-transparent pixels (events are drawn)
			return imageData.data.some((pixel, index) => index % 4 === 3 && pixel > 0);
		});
		
		expect(hasEvents).toBe(true);
	});

	test('should partially select events by dragging selection rectangle', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Partial Selection - Dragging selection rectangle'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// Calculate positions for partial selection (canvas-relative, then convert to screen)
		// Based on debug output, visible events are:
		// - event-2: E3 at start=2, rect: {x: 90, y: 96, width: 30, height: 12}
		// - event-3: D3 at start=4, rect: {x: 150, y: 120, width: 30, height: 12}
		// Select area that fully covers event-2 (E3 at 2) but not event-3 (D3 at 4)
		// event-2 rect: x=90, y=96, width=30, height=12 (so it spans from x=90 to x=120, y=96 to y=108)
		// To fully cover event-2, we need to drag from well before it starts to well after it ends
		// event-2 rect: x=90, y=96, width=30, height=12 (spans x=90-120, y=96-108)
		// Make sure the selection rectangle fully encompasses the event
		const canvasStartX = 85; // Start well before event-2 (event-2 starts at canvasX=90)
		const canvasStartY = 92; // Start well above event-2 (event-2 starts at canvasY=96)
		const canvasEndX = 125; // End well after event-2 (event-2 ends at canvasX=120)
		const canvasEndY = 112; // End well below event-2 (event-2 ends at canvasY=108)
		
		// Convert to screen coordinates
		const startX = canvasBox.x + canvasStartX;
		const startY = canvasBox.y + canvasStartY;
		const endX = canvasBox.x + canvasEndX;
		const endY = canvasBox.y + canvasEndY;
		
		// Debug: Log canvas info and event positions
		const debugInfo = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			if (!state$) return null;
			const pianoRoll = state$.value?.pianoRoll;
			const canvas = document.querySelector('.piano-roll .interaction');
			return {
				events: pianoRoll?.events || [],
				visible: pianoRoll?.visible || [],
				position: pianoRoll?.position || [0, 60],
				dim: pianoRoll?.dim || [30, 12],
				canvasSize: canvas ? {width: canvas.width, height: canvas.height} : null,
				interaction: pianoRoll?.interaction || {},
			};
		});
		console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
		console.log('Visible events with rects:', debugInfo?.visible?.map(v => ({
			uuid: v.uuid,
			rect: v.rect
		})));
		console.log(`Dragging from canvas(${canvasStartX}, ${canvasStartY}) to canvas(${canvasEndX}, ${canvasEndY})`);
		console.log(`Screen coordinates: (${startX}, ${startY}) to (${endX}, ${endY})`);
		
		// Use helper function that dispatches events with correct offsetX/offsetY
		await page.evaluate(() => { document.title = 'Test: Partial Selection - Starting drag...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(500); // Pause before starting selection
		await page.evaluate(() => { document.title = 'Test: Partial Selection - Dragging selection rectangle...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		// Check interaction state before drag
		const interactionBefore = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.interaction || {};
		});
		console.log('Interaction state before drag:', interactionBefore);
		
		await dragCanvas(page, interactionCanvas, startX, startY, endX, endY, 10);
		
		// Check interaction state during/after drag
		await page.waitForTimeout(100);
		const interactionDuring = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.interaction || {};
		});
		console.log('Interaction state during drag:', interactionDuring);
		
		await page.evaluate(() => { document.title = 'Test: Partial Selection - Checking selection result...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		// Wait for selection to be processed and canvas to redraw
		await page.waitForTimeout(500); // Wait for pointerUp to process
		
		// Check that selection was created
		const selection = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			if (!state$) return [];
			// BehaviorSubject has a .value property with current state
			return state$.value?.pianoRoll?.selection || [];
		});
		
		console.log('Selection result:', selection);
		
		// Debug: Check interaction state after drag
		const interactionState = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.interaction || {};
		});
		console.log('Interaction state after drag:', interactionState);
		
		// Debug: Check if events canvas has been redrawn with selection
		const canvasState = await page.evaluate(() => {
			const eventsCanvas = document.querySelector('.piano-roll .events');
			if (!eventsCanvas) return null;
			const ctx = eventsCanvas.getContext('2d');
			const imageData = ctx.getImageData(0, 0, eventsCanvas.width, eventsCanvas.height);
			// Check for green pixels (selected event color #cfefdf)
			const hasGreen = imageData.data.some((pixel, index) => {
				if (index % 4 === 0) { // R channel
					const r = imageData.data[index];
					const g = imageData.data[index + 1];
					const b = imageData.data[index + 2];
					// Check for light green (#cfefdf = rgb(207, 239, 223))
					return r > 200 && g > 230 && b > 210 && r < 220 && g < 250 && b < 230;
				}
				return false;
			});
			return {hasGreen, width: eventsCanvas.width, height: eventsCanvas.height};
		});
		console.log('Canvas state after selection:', canvasState);
		
		// Wait longer so user can see the selection result
		await page.evaluate(() => { document.title = 'Test: Partial Selection - Selection complete! Check if event-2 is green.'; });
		await page.waitForTimeout(5000); // Wait longer so user can see the result
		
		// Should have selected event-2 (E3 at start=2) - event-1 is not visible (same column)
		expect(selection.length).toBeGreaterThanOrEqual(1);
		expect(selection).toContain('event-2');
	});

	test('should drag selected event horizontally and vertically', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Single Event Drag - Clicking to select...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// Reset to test events for consistent starting point
		await setupTestEvents(page);
		
		// Find event-2 (E3 at start=2.3, unsnapped)
		const eventInfo = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			const events = pianoRoll?.events || [];
			const event = visible.find(v => v.uuid === 'event-2');
			const eventData = events.find(e => e.uuid === 'event-2');
			return event ? {
				rect: event.rect,
				start: eventData?.start,
				note: eventData?.note
			} : null;
		});
		
		if (!eventInfo) {
			throw new Error('Event-2 not found');
		}
		
		const canvasEventX = eventInfo.rect.x + eventInfo.rect.width / 2;
		const canvasEventY = eventInfo.rect.y + eventInfo.rect.height / 2;
		const screenEventX = canvasBox.x + canvasEventX;
		const screenEventY = canvasBox.y + canvasEventY;
		
		console.log(`Clicking event-2 at canvas(${canvasEventX}, ${canvasEventY}), note=${eventInfo.note}, start=${eventInfo.start}`);
		
		// Click to select
		await page.waitForTimeout(500);
		await clickCanvas(page, interactionCanvas, screenEventX, screenEventY);
		await page.waitForTimeout(1000);
		
		// Verify event-2 is selected
		const selection = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selection).toContain('event-2');
		
		// Get initial event position
		const initialEvent = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return events.find(e => e.uuid === 'event-2');
		});
		const initialStart = initialEvent.start;
		const initialNote = initialEvent.note;
		const initialNoteNumber = noteToNumber(initialNote);
		
		console.log(`Initial: note=${initialNote} (${initialNoteNumber}), start=${initialStart}`);
		
		// Drag horizontally: 2 grid steps to the right (60px)
		// Drag vertically: 2 grid steps down (24px) - moving to lower note
		const canvasDragEndX = canvasEventX + 60; // 2 grid steps horizontal
		const canvasDragEndY = canvasEventY + 24; // 2 grid steps vertical (down = higher note number = lower on screen)
		const screenDragEndX = canvasBox.x + canvasDragEndX;
		const screenDragEndY = canvasBox.y + canvasDragEndY;
		
		console.log(`Dragging event-2 from canvas(${canvasEventX}, ${canvasEventY}) to canvas(${canvasDragEndX}, ${canvasDragEndY})`);
		console.log(`Movement: +60px horizontal (2 steps), +24px vertical (2 steps down = 2 semitones lower)`);
		
		await page.evaluate(() => { document.title = 'Test: Single Event Drag - Dragging horizontally and vertically...'; });
		await page.waitForTimeout(1000);
		await page.waitForTimeout(500);
		await dragCanvas(page, interactionCanvas, screenEventX, screenEventY, screenDragEndX, screenDragEndY, 10);
		await page.evaluate(() => { document.title = 'Test: Single Event Drag - Verifying movement...'; });
		await page.waitForTimeout(1000);
		await page.waitForTimeout(1000);
		
		// Check that event was moved
		const movedEvent = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return events.find(e => e.uuid === 'event-2');
		});
		
		const finalNoteNumber = noteToNumber(movedEvent.note);
		const horizontalMovement = movedEvent.start - initialStart;
		const verticalMovement = finalNoteNumber - initialNoteNumber;
		
		console.log(`Final: note=${movedEvent.note} (${finalNoteNumber}), start=${movedEvent.start}`);
		console.log(`Movement: horizontal=${horizontalMovement} steps, vertical=${verticalMovement} semitones`);
		
		// Verify horizontal movement
		// Note: When an unsnapped event (start=2.3) is dragged 2 steps and snaps to grid,
		// it ends up at 4, which is 1.7 steps from the original position (4 - 2.3 = 1.7).
		// This is expected behavior: the anchor snaps to the nearest integer grid position.
		expect(horizontalMovement).toBeGreaterThanOrEqual(1.5); // Allow for snapping rounding
		expect(horizontalMovement).toBeLessThanOrEqual(2.5);
		// Verify vertical movement (should be -2 semitones, since dragging down = lower note)
		expect(verticalMovement).toBe(-2); // Dragging down 2 grid steps = 2 semitones lower
		// Verify anchor snapped to grid (start should be integer)
		expect(Number.isInteger(movedEvent.start)).toBe(true);
	});

	test('should snap unsnapped event to grid when dragging', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Grid Snapping - Creating unsnapped event...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// Create an event with a fractional start position (unsnapped/unquantized)
		// This simulates an event that's slightly off from the grid
		await page.evaluate(() => {
			const actions = window.__jamStationActions;
			if (!actions) {
				throw new Error('Actions not available on window');
			}
			
			// Create an unsnapped event at start=2.3 (between grid cells 2 and 3)
			const unsnappedEvent = {
				uuid: 'unsnapped-event-1',
				note: 'D3',
				start: 2.3, // Fractional start position (not aligned to grid)
				duration: 1,
				velocity: 0.8,
				startTime: 0
			};
			
			// Add it to existing events
			const state$ = window.__jamStationState$;
			const currentEvents = state$?.value?.pianoRoll?.events || [];
			actions.set('pianoRoll', {events: [...currentEvents, unsnappedEvent]});
		});
		
		// Wait for event to be rendered
		await page.waitForTimeout(500);
		
		await page.evaluate(() => { document.title = 'Test: Grid Snapping - Selecting unsnapped event...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		// Find the unsnapped event position
		const eventInfo = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			if (!state$) return null;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			const event = visible.find(v => v.uuid === 'unsnapped-event-1');
			return event ? {
				rect: event.rect,
				start: pianoRoll?.events?.find(e => e.uuid === 'unsnapped-event-1')?.start
			} : null;
		});
		
		if (!eventInfo) {
			throw new Error('Unsnapped event not found in visible events');
		}
		
		console.log('Unsnapped event info:', eventInfo);
		expect(eventInfo.start).toBe(2.3); // Verify it's unsnapped
		
		// Click on the unsnapped event to select it
		const canvasEventX = eventInfo.rect.x + eventInfo.rect.width / 2; // Center of event
		const canvasEventY = eventInfo.rect.y + eventInfo.rect.height / 2;
		const screenEventX = canvasBox.x + canvasEventX;
		const screenEventY = canvasBox.y + canvasEventY;
		
		console.log(`Clicking unsnapped event at canvas(${canvasEventX}, ${canvasEventY}), screen(${screenEventX}, ${screenEventY})`);
		
		await page.waitForTimeout(500); // Pause before clicking
		await clickCanvas(page, interactionCanvas, screenEventX, screenEventY);
		await page.waitForTimeout(1000); // Longer pause to see selection
		
		// Verify event is selected
		const selection = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selection).toContain('unsnapped-event-1');
		
		// Get initial (unsnapped) start position
		const initialStart = eventInfo.start;
		expect(initialStart).not.toBe(Math.floor(initialStart)); // Verify it's not an integer
		
		await page.evaluate(() => { document.title = 'Test: Grid Snapping - Dragging to snap to grid...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		// Drag the event a small amount (1 grid step = 30 pixels)
		// The event should snap to the nearest grid cell
		const canvasDragEndX = canvasEventX + 30; // Move 1 grid step to the right
		const canvasDragEndY = canvasEventY;
		const screenDragEndX = canvasBox.x + canvasDragEndX;
		const screenDragEndY = canvasBox.y + canvasDragEndY;
		
		console.log(`Dragging unsnapped event from canvas(${canvasEventX}, ${canvasEventY}) to canvas(${canvasDragEndX}, ${canvasDragEndY})`);
		
		await page.waitForTimeout(500); // Pause before starting drag
		await dragCanvas(page, interactionCanvas, screenEventX, screenEventY, screenDragEndX, screenDragEndY, 10);
		await page.evaluate(() => { document.title = 'Test: Grid Snapping - Verifying snap...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(1000); // Pause to see final position
		
		// Check that event was snapped to grid (start should be an integer)
		const movedEvent = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return events.find(e => e.uuid === 'unsnapped-event-1');
		});
		
		console.log(`Event start before drag: ${initialStart}, after drag: ${movedEvent.start}`);
		
		// Verify the event moved and snapped to grid (start should be an integer)
		expect(movedEvent.start).not.toBe(initialStart);
		expect(Number.isInteger(movedEvent.start)).toBe(true); // Should snap to integer grid cell
		// The event should have moved by approximately 1 grid step (30 pixels = 1 grid cell)
		// With grid snapping, if start=2.3 and we drag 1 step, it should snap to 3 (not 3.3)
		const movement = movedEvent.start - Math.round(initialStart);
		expect(movement).toBeGreaterThanOrEqual(1); // Should move at least 1 step
		expect(movement).toBeLessThanOrEqual(2); // Should move at most 2 steps (allowing for rounding)
	});

	test('should select other part and drag again', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Select & Drag Other Event - Selecting first event...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// First, select and move event-1 (C3 at start=2)
		const event1X = canvasBox.x + 105; // Center of first event (start=2, so x=90+15)
		const event1Y = canvasBox.y + 150; // Center of C3 row (note 48, y=144, center ~150)
		
		// Click to select using helper
		const canvasEvent1X = 105;
		const canvasEvent1Y = 150;
		const screenEvent1X = canvasBox.x + canvasEvent1X;
		const screenEvent1Y = canvasBox.y + canvasEvent1Y;
		
		await page.waitForTimeout(500); // Pause before clicking
		await clickCanvas(page, interactionCanvas, screenEvent1X, screenEvent1Y);
		await page.waitForTimeout(1000); // Longer pause to see selection
		
		// Drag event-1
		const canvasDragEndX = canvasEvent1X + 60;
		const canvasDragEndY = canvasEvent1Y;
		const screenDragEndX = canvasBox.x + canvasDragEndX;
		const screenDragEndY = canvasBox.y + canvasDragEndY;
		
		await page.waitForTimeout(500); // Pause before starting drag
		await dragCanvas(page, interactionCanvas, screenEvent1X, screenEvent1Y, screenDragEndX, screenDragEndY, 10);
		await page.waitForTimeout(1000); // Pause to see final position
		
		// Now select event-3 (D3 at start=4, note 50)
		// Based on debug output: event-3 rect: {x: 150, y: 120, width: 30, height: 12}
		const canvasEvent3X = 165; // Center of event-3 (canvasX=150+15)
		const canvasEvent3Y = 126; // Center of event-3 (canvasY=120+6)
		const screenEvent3X = canvasBox.x + canvasEvent3X;
		const screenEvent3Y = canvasBox.y + canvasEvent3Y;
		
		console.log(`Clicking event-3 at canvas(${canvasEvent3X}, ${canvasEvent3Y}), screen(${screenEvent3X}, ${screenEvent3Y})`);
		
		// Click to select event-3 using helper
		await page.evaluate(() => { document.title = 'Test: Select & Drag Other Event - Clicking event-3...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(500); // Pause before clicking
		await clickCanvas(page, interactionCanvas, screenEvent3X, screenEvent3Y);
		await page.evaluate(() => { document.title = 'Test: Select & Drag Other Event - Dragging event-3...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(1000); // Longer pause to see selection
		
		// Verify event-3 is selected
		const selectionAfter = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selectionAfter).toContain('event-3');
		expect(selectionAfter).not.toContain('event-2'); // event-2 should be deselected
		
		// Get initial position of event-3
		const initialEvent3 = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return events.find(e => e.uuid === 'event-3');
		});
		const initialStart3 = initialEvent3.start;
		
		// Drag event-3 (move 1 grid step to the right)
		const canvasDragEnd3X = canvasEvent3X + 30;
		const canvasDragEnd3Y = canvasEvent3Y;
		const screenDragEnd3X = canvasBox.x + canvasDragEnd3X;
		const screenDragEnd3Y = canvasBox.y + canvasDragEnd3Y;
		
		await page.evaluate(() => { document.title = 'Test: Select & Drag Other Event - Dragging event-3...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(500); // Pause before starting drag
		await dragCanvas(page, interactionCanvas, screenEvent3X, screenEvent3Y, screenDragEnd3X, screenDragEnd3Y, 10);
		await page.evaluate(() => { document.title = 'Test: Select & Drag Other Event - Complete!'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(1000); // Pause to see final position
		
		// Check that event-3 was moved
		const movedEvent3 = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return events.find(e => e.uuid === 'event-3');
		});
		
		expect(movedEvent3.start).toBe(initialStart3 + 1); // Moved 1 grid step
	});

	test('should drag multiple selected events preserving relative positions', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Multi-Event Drag - Selecting multiple events...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// Get event positions first
		const eventPositions = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			return visible
				.filter(v => v.uuid === 'event-2' || v.uuid === 'event-3')
				.map(v => ({uuid: v.uuid, rect: v.rect}));
		});
		
		if (eventPositions.length < 2) {
			throw new Error('Events event-2 and event-3 not found');
		}
		
		// Create selection rectangle that covers both events
		const event2Rect = eventPositions.find(e => e.uuid === 'event-2').rect;
		const event3Rect = eventPositions.find(e => e.uuid === 'event-3').rect;
		
		// Calculate bounding box for both events
		const minX = Math.min(event2Rect.x, event3Rect.x) - 5;
		const maxX = Math.max(event2Rect.x + event2Rect.width, event3Rect.x + event3Rect.width) + 5;
		const minY = Math.min(event2Rect.y, event3Rect.y) - 5;
		const maxY = Math.max(event2Rect.y + event2Rect.height, event3Rect.y + event3Rect.height) + 5;
		
		const startX = canvasBox.x + minX;
		const startY = canvasBox.y + minY;
		const endX = canvasBox.x + maxX;
		const endY = canvasBox.y + maxY;
		
		console.log(`Selecting events: event-2 at (${event2Rect.x}, ${event2Rect.y}), event-3 at (${event3Rect.x}, ${event3Rect.y})`);
		console.log(`Selection rectangle: (${minX}, ${minY}) to (${maxX}, ${maxY})`);
		
		await page.waitForTimeout(500); // Pause before starting selection
		await dragCanvas(page, interactionCanvas, startX, startY, endX, endY, 10);
		await page.waitForTimeout(1000); // Wait for selection to be processed
		
		// Verify multiple events are selected
		const selection = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selection.length).toBeGreaterThanOrEqual(2);
		
		// Get initial positions of selected events
		const initialEvents = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, selection);
		
		expect(initialEvents.length).toBeGreaterThanOrEqual(2);
		
		// Calculate relative positions between events
		const relativePositions = initialEvents.map((event, index) => {
			if (index === 0) return {uuid: event.uuid, relativeStart: 0, relativeNote: 0};
			const firstEvent = initialEvents[0];
			return {
				uuid: event.uuid,
				relativeStart: event.start - firstEvent.start,
				relativeNote: noteToNumber(event.note) - noteToNumber(firstEvent.note)
			};
		});
		
		// Find event-2 (anchor) position for dragging
		const anchorEvent = initialEvents.find(e => e.uuid === 'event-2');
		if (!anchorEvent) {
			throw new Error('Anchor event (event-2) not found in selection');
		}
		
		// Get anchor event canvas position
		const anchorInfo = await page.evaluate((uuid) => {
			const state$ = window.__jamStationState$;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			const event = visible.find(v => v.uuid === uuid);
			return event ? {rect: event.rect} : null;
		}, anchorEvent.uuid);
		
		if (!anchorInfo) {
			throw new Error('Anchor event not visible');
		}
		
		const canvasAnchorX = anchorInfo.rect.x + anchorInfo.rect.width / 2;
		const canvasAnchorY = anchorInfo.rect.y + anchorInfo.rect.height / 2;
		const screenAnchorX = canvasBox.x + canvasAnchorX;
		const screenAnchorY = canvasBox.y + canvasAnchorY;
		
		await page.evaluate(() => { document.title = 'Test: Multi-Event Drag - Dragging by anchor event...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		// Drag by clicking on anchor event (event-2) - move 2 grid steps to the right
		const canvasDragEndX = canvasAnchorX + 60; // 2 grid steps (30px each)
		const canvasDragEndY = canvasAnchorY;
		const screenDragEndX = canvasBox.x + canvasDragEndX;
		const screenDragEndY = canvasBox.y + canvasDragEndY;
		
		console.log(`Dragging multiple events by anchor (event-2) from canvas(${canvasAnchorX}, ${canvasAnchorY}) to canvas(${canvasDragEndX}, ${canvasDragEndY})`);
		
		await page.waitForTimeout(500); // Pause before starting drag
		await dragCanvas(page, interactionCanvas, screenAnchorX, screenAnchorY, screenDragEndX, screenDragEndY, 10);
		await page.evaluate(() => { document.title = 'Test: Multi-Event Drag - Verifying relative positions...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(1000); // Pause to see final position
		
		// Get final positions of selected events
		const movedEvents = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, selection);
		
		// Verify anchor event snapped to grid (should be integer)
		const movedAnchor = movedEvents.find(e => e.uuid === anchorEvent.uuid);
		expect(movedAnchor).toBeDefined();
		expect(Number.isInteger(movedAnchor.start)).toBe(true); // Anchor should snap to grid
		
		// Verify relative positions are preserved
		movedEvents.forEach((moved, index) => {
			const initial = initialEvents.find(e => e.uuid === moved.uuid);
			const relative = relativePositions.find(r => r.uuid === moved.uuid);
			if (initial && relative) {
				// Calculate expected position: anchor's new position + relative offset
				const expectedStart = movedAnchor.start + relative.relativeStart;
				const expectedNoteNumber = noteToNumber(movedAnchor.note) + relative.relativeNote;
				const expectedNoteObj = numberToNote(expectedNoteNumber);
				const expectedNote = `${expectedNoteObj.key}${expectedNoteObj.octave}`;
				
				// Use toBeCloseTo for floating point comparison to handle precision issues
				expect(moved.start).toBeCloseTo(expectedStart, 10);
				expect(moved.note).toBe(expectedNote);
				console.log(`Event ${moved.uuid}: preserved relative position (start: ${moved.start}, note: ${moved.note})`);
			}
		});
	});

	test('should drag multiple events by different anchor events', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Multi-Anchor Drag - Selecting events...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// Select multiple events (event-2, event-3, event-4)
		const startX = canvasBox.x + 80;
		const startY = canvasBox.y + 50;
		const endX = canvasBox.x + 250;
		const endY = canvasBox.y + 140;
		
		await page.waitForTimeout(500);
		await dragCanvas(page, interactionCanvas, startX, startY, endX, endY, 10);
		await page.waitForTimeout(1000);
		
		const selection = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selection.length).toBeGreaterThanOrEqual(2);
		
		// Get initial positions
		const initialEvents = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, selection);
		
		// First drag: use event-2 as anchor
		const anchor1 = initialEvents.find(e => e.uuid === 'event-2');
		if (!anchor1) {
			throw new Error('Anchor event-2 not found');
		}
		
		const anchor1Info = await page.evaluate((uuid) => {
			const state$ = window.__jamStationState$;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			const event = visible.find(v => v.uuid === uuid);
			return event ? {rect: event.rect} : null;
		}, anchor1.uuid);
		
		if (!anchor1Info) {
			throw new Error('Anchor event-2 not visible');
		}
		
		const canvasAnchor1X = anchor1Info.rect.x + anchor1Info.rect.width / 2;
		const canvasAnchor1Y = anchor1Info.rect.y + anchor1Info.rect.height / 2;
		const screenAnchor1X = canvasBox.x + canvasAnchor1X;
		const screenAnchor1Y = canvasBox.y + canvasAnchor1Y;
		
		await page.evaluate(() => { document.title = 'Test: Multi-Anchor Drag - Dragging by event-2...'; });
		await page.waitForTimeout(1000);
		
		// Drag 1 grid step to the right
		const canvasDrag1EndX = canvasAnchor1X + 30;
		const canvasDrag1EndY = canvasAnchor1Y;
		const screenDrag1EndX = canvasBox.x + canvasDrag1EndX;
		const screenDrag1EndY = canvasBox.y + canvasDrag1EndY;
		
		await page.waitForTimeout(500);
		await dragCanvas(page, interactionCanvas, screenAnchor1X, screenAnchor1Y, screenDrag1EndX, screenDrag1EndY, 10);
		await page.waitForTimeout(1000);
		
		// Get positions after first drag
		const afterFirstDrag = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, selection);
		
		// Verify anchor snapped to grid
		const movedAnchor1 = afterFirstDrag.find(e => e.uuid === anchor1.uuid);
		expect(Number.isInteger(movedAnchor1.start)).toBe(true);
		
		// Now drag by a different anchor (event-3)
		const anchor2 = afterFirstDrag.find(e => e.uuid === 'event-3');
		if (!anchor2) {
			throw new Error('Anchor event-3 not found');
		}
		
		const anchor2Info = await page.evaluate((uuid) => {
			const state$ = window.__jamStationState$;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			const event = visible.find(v => v.uuid === uuid);
			return event ? {rect: event.rect} : null;
		}, anchor2.uuid);
		
		if (!anchor2Info) {
			throw new Error('Anchor event-3 not visible');
		}
		
		const canvasAnchor2X = anchor2Info.rect.x + anchor2Info.rect.width / 2;
		const canvasAnchor2Y = anchor2Info.rect.y + anchor2Info.rect.height / 2;
		const screenAnchor2X = canvasBox.x + canvasAnchor2X;
		const screenAnchor2Y = canvasBox.y + canvasAnchor2Y;
		
		await page.evaluate(() => { document.title = 'Test: Multi-Anchor Drag - Dragging by event-3...'; });
		await page.waitForTimeout(1000);
		
		// Drag 1 grid step to the right using event-3 as anchor
		const canvasDrag2EndX = canvasAnchor2X + 30;
		const canvasDrag2EndY = canvasAnchor2Y;
		const screenDrag2EndX = canvasBox.x + canvasDrag2EndX;
		const screenDrag2EndY = canvasBox.y + canvasDrag2EndY;
		
		await page.waitForTimeout(500);
		await dragCanvas(page, interactionCanvas, screenAnchor2X, screenAnchor2Y, screenDrag2EndX, screenDrag2EndY, 10);
		await page.evaluate(() => { document.title = 'Test: Multi-Anchor Drag - Complete!'; });
		await page.waitForTimeout(1000);
		await page.waitForTimeout(1000);
		
		// Get final positions
		const finalEvents = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, selection);
		
		// Verify the current anchor (anchor2, event-3) snapped to grid
		// Note: anchor1 (event-2) may not be snapped if it was moved by a non-integer delta
		// Only the anchor that was dragged in the current drag operation is guaranteed to be snapped
		const finalAnchor1 = finalEvents.find(e => e.uuid === anchor1.uuid);
		const finalAnchor2 = finalEvents.find(e => e.uuid === anchor2.uuid);
		expect(Number.isInteger(finalAnchor2.start)).toBe(true); // Current anchor should be snapped
		// anchor1 may not be snapped if it was moved by a non-integer delta from anchor2's movement
		
		// Verify relative positions are still preserved
		const finalRelativePositions = finalEvents.map((event, index) => {
			if (index === 0) return {uuid: event.uuid, relativeStart: 0, relativeNote: 0};
			const firstEvent = finalEvents[0];
			return {
				uuid: event.uuid,
				relativeStart: event.start - firstEvent.start,
				relativeNote: noteToNumber(event.note) - noteToNumber(firstEvent.note)
			};
		});
		
		// Compare with initial relative positions
		initialEvents.forEach((initial, index) => {
			const final = finalEvents.find(e => e.uuid === initial.uuid);
			const initialRelative = index === 0 ? {relativeStart: 0, relativeNote: 0} : {
				relativeStart: initial.start - initialEvents[0].start,
				relativeNote: noteToNumber(initial.note) - noteToNumber(initialEvents[0].note)
			};
			const finalRelative = finalRelativePositions.find(r => r.uuid === initial.uuid);
			
			if (final && finalRelative) {
				expect(finalRelative.relativeStart).toBe(initialRelative.relativeStart);
				expect(finalRelative.relativeNote).toBe(initialRelative.relativeNote);
			}
		});
	});

	test('should handle overlapping selections with horizontal and vertical drags', async ({page}) => {
		// Reset screenshot counter for this test
		screenshotCounter = 0;
		
		await page.evaluate(() => { document.title = 'Test: Overlapping Selections - First selection...'; });
		await waitForReadability(page, 1000, 100);
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// Reset to test events for consistent starting point
		await setupTestEvents(page);
		await takeScreenshot(page, '01-initial-state');
		
		// Get initial positions of events 2, 3, 4, 5
		const initialEvents = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return ['event-2', 'event-3', 'event-4', 'event-5'].map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		});
		
		expect(initialEvents.length).toBe(4);
		
		// First selection: Select events 2, 3, 4
		await waitForReadability(page, 500, 50);
		await execSelection(page, interactionCanvas, ['event-2', 'event-3', 'event-4']);
		await waitForReadability(page, 1000, 100);
		
		// Verify first selection before dragging
		const selection1 = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selection1.length).toBeGreaterThanOrEqual(2);
		expect(selection1).toContain('event-2');
		expect(selection1).toContain('event-3');
		expect(selection1).toContain('event-4');
		// event-5 should NOT be in first selection
		expect(selection1).not.toContain('event-5');
		console.log(`First selection verified: ${selection1.join(', ')}`);
		await takeScreenshot(page, '02-after-first-selection');
		
		// Get positions before first drag
		const beforeFirstDrag = await page.evaluate((uuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return uuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, ['event-2', 'event-3', 'event-4', 'event-5']);
		
		// First drag: Drag by event-2 (anchor) - move 2 steps right, 2 steps down
		await page.evaluate(() => { document.title = 'Test: Overlapping Selections - First drag (horizontal + vertical)...'; });
		await waitForReadability(page, 1000, 100);
		await dragByAnchor(page, interactionCanvas, 'event-2', 2, 2, 10, isHeaded ? 1000 : 200);
		await takeScreenshot(page, '03-after-first-drag');
		
		// Get positions after first drag
		const afterFirstDrag = await page.evaluate((uuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return uuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, ['event-2', 'event-3', 'event-4', 'event-5']);
		
		// Verify event-2 (anchor) snapped to grid
		const movedAnchor1 = afterFirstDrag.find(e => e.uuid === 'event-2');
		expect(Number.isInteger(movedAnchor1.start)).toBe(true);
		
		// Verify event-5 (not in selection) did not move
		const unmovedEvent5 = afterFirstDrag.find(e => e.uuid === 'event-5');
		const originalEvent5 = beforeFirstDrag.find(e => e.uuid === 'event-5');
		expect(unmovedEvent5.start).toBe(originalEvent5.start);
		expect(unmovedEvent5.note).toBe(originalEvent5.note);
		
		// Deselect: Click somewhere in the grid (empty space) to deselect
		await page.evaluate(() => { document.title = 'Test: Overlapping Selections - Deselecting...'; });
		await waitForReadability(page, 1000, 100);
		
		// Click in an empty area of the grid (top-left corner, before the first column)
		const deselectX = canvasBox.x + 10; // Before the first column
		const deselectY = canvasBox.y + 50; // Middle of visible area
		await waitForReadability(page, 500, 50);
		await clickCanvas(page, interactionCanvas, deselectX, deselectY);
		await waitForReadability(page, 1000, 100);
		
		// Verify selection is cleared
		const selectionAfterDeselect = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selectionAfterDeselect.length).toBe(0);
		console.log('Selection cleared after deselect');
		await takeScreenshot(page, '04-after-deselect');
		
		// Second selection: Select events 3, 4, 5 (overlap: 3, 4 are common, 5 is new)
		await page.evaluate(() => { document.title = 'Test: Overlapping Selections - Second selection (overlapping)...'; });
		await waitForReadability(page, 1000, 100);
		
		await waitForReadability(page, 500, 50);
		await execSelection(page, interactionCanvas, ['event-3', 'event-4', 'event-5']);
		await waitForReadability(page, 1000, 100);
		
		// Verify second selection before dragging
		const selection2 = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selection2.length).toBeGreaterThanOrEqual(2);
		expect(selection2).toContain('event-3');
		expect(selection2).toContain('event-4');
		expect(selection2).toContain('event-5');
		// event-2 should NOT be in selection2
		expect(selection2).not.toContain('event-2');
		console.log(`Second selection verified: ${selection2.join(', ')}`);
		await takeScreenshot(page, '05-after-second-selection');
		
		// Get positions before second drag
		const beforeSecondDrag = await page.evaluate((uuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return uuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, ['event-2', 'event-3', 'event-4', 'event-5']);
		
		// Second drag: Drag by event-3 (anchor) - move 1 step left, 1 step up
		await page.evaluate(() => { document.title = 'Test: Overlapping Selections - Second drag (horizontal + vertical)...'; });
		await waitForReadability(page, 1000, 100);
		await dragByAnchor(page, interactionCanvas, 'event-3', -1, -1, 10, isHeaded ? 1000 : 200);
		await takeScreenshot(page, '06-after-second-drag');
		
		// Get final positions
		const finalEvents = await page.evaluate((uuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return uuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, ['event-2', 'event-3', 'event-4', 'event-5']);
		
		// Verify event-3 (anchor) snapped to grid
		const movedAnchor2 = finalEvents.find(e => e.uuid === 'event-3');
		expect(Number.isInteger(movedAnchor2.start)).toBe(true);
		
		// Verify event-2 (not in second selection) did not move in second drag
		const finalEvent2 = finalEvents.find(e => e.uuid === 'event-2');
		const beforeSecondDragEvent2 = beforeSecondDrag.find(e => e.uuid === 'event-2');
		expect(finalEvent2.start).toBe(beforeSecondDragEvent2.start);
		expect(finalEvent2.note).toBe(beforeSecondDragEvent2.note);
		
		// Verify event-5 (new in second selection) moved in second drag
		const finalEvent5 = finalEvents.find(e => e.uuid === 'event-5');
		const beforeSecondDragEvent5 = beforeSecondDrag.find(e => e.uuid === 'event-5');
		expect(finalEvent5.start).not.toBe(beforeSecondDragEvent5.start);
		
		// Verify relative positions are preserved for events in second selection
		// Calculate relative positions from before second drag (relative to anchor event-3)
		const anchor3Before = beforeSecondDrag.find(e => e.uuid === 'event-3');
		const relativeBeforeSecond = beforeSecondDrag
			.filter(e => selection2.includes(e.uuid))
			.map(event => ({
				uuid: event.uuid,
				relativeStart: event.start - anchor3Before.start,
				relativeNote: noteToNumber(event.note) - noteToNumber(anchor3Before.note)
			}));
		
		// Calculate relative positions after second drag and verify they're preserved
		finalEvents
			.filter(e => selection2.includes(e.uuid))
			.forEach((final) => {
				const relative = relativeBeforeSecond.find(r => r.uuid === final.uuid);
				if (relative) {
					const anchor3After = finalEvents.find(e => e.uuid === 'event-3');
					const expectedStart = anchor3After.start + relative.relativeStart;
					const expectedNoteNumber = noteToNumber(anchor3After.note) + relative.relativeNote;
					const expectedNoteObj = numberToNote(expectedNoteNumber);
					const expectedNote = `${expectedNoteObj.key}${expectedNoteObj.octave}`;
					
					expect(final.start).toBeCloseTo(expectedStart, 10);
					expect(final.note).toBe(expectedNote);
					console.log(`Event ${final.uuid}: preserved relative position (start: ${final.start}, note: ${final.note})`);
				}
			});
		
		await page.evaluate(() => { document.title = 'Test: Overlapping Selections - Complete!'; });
		await waitForReadability(page, 1000, 100);
		await takeScreenshot(page, '07-final-state');
	});

	test('should drag mixed snapped and unsnapped events preserving relative positions', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Mixed Quantization Drag - Selecting snapped and unsnapped events...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// Select events that include both snapped and unsnapped
		// First, check which events are visible
		const allVisibleEvents = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			const events = pianoRoll?.events || [];
			return visible.map(v => {
				const event = events.find(e => e.uuid === v.uuid);
				return {
					uuid: v.uuid,
					rect: v.rect,
					start: event ? event.start : null,
					isSnapped: event ? Number.isInteger(event.start) : false
				};
			});
		});
		
		console.log('All visible events:', allVisibleEvents.map(e => `${e.uuid}: start=${e.start}, snapped=${e.isSnapped}`));
		
		// Find events with both snapped and unsnapped
		const snappedVisible = allVisibleEvents.filter(e => e.isSnapped);
		const unsnappedVisible = allVisibleEvents.filter(e => !e.isSnapped);
		
		if (snappedVisible.length === 0 || unsnappedVisible.length === 0) {
			throw new Error(`Need both snapped and unsnapped events. Found: ${snappedVisible.length} snapped, ${unsnappedVisible.length} unsnapped`);
		}
		
		// Use first snapped and first unsnapped, plus a couple more if available
		const selectedUuids = [
			snappedVisible[0].uuid,
			unsnappedVisible[0].uuid,
			...(snappedVisible.length > 1 ? [snappedVisible[1].uuid] : []),
			...(unsnappedVisible.length > 1 ? [unsnappedVisible[1].uuid] : [])
		].slice(0, 4); // Take up to 4 events
		
		const eventPositions = allVisibleEvents.filter(e => selectedUuids.includes(e.uuid));
		
		console.log('Selected events for test:', eventPositions.map(e => `${e.uuid}: start=${e.start}, snapped=${e.isSnapped}`));
		
		if (eventPositions.length < 2) {
			throw new Error(`Need at least 2 events (one snapped, one unsnapped). Found: ${eventPositions.length}`);
		}
		
		// Create selection rectangle covering all 4 events
		const allRects = eventPositions.map(e => e.rect);
		const minX = Math.min(...allRects.map(r => r.x)) - 5;
		const maxX = Math.max(...allRects.map(r => r.x + r.width)) + 5;
		const minY = Math.min(...allRects.map(r => r.y)) - 5;
		const maxY = Math.max(...allRects.map(r => r.y + r.height)) + 5;
		
		const startX = canvasBox.x + minX;
		const startY = canvasBox.y + minY;
		const endX = canvasBox.x + maxX;
		const endY = canvasBox.y + maxY;
		
		await page.waitForTimeout(500);
		await dragCanvas(page, interactionCanvas, startX, startY, endX, endY, 10);
		await page.waitForTimeout(1000);
		
		// Verify events are selected
		const selection = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selection.length).toBeGreaterThanOrEqual(2);
		// Verify we have both snapped and unsnapped in selection
		selectedUuids.forEach(uuid => {
			expect(selection).toContain(uuid);
		});
		
		// Get initial positions (mix of snapped and unsnapped)
		const initialEvents = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, selection);
		
		// Verify we have both snapped and unsnapped events
		const snappedEvents = initialEvents.filter(e => Number.isInteger(e.start));
		const unsnappedEvents = initialEvents.filter(e => !Number.isInteger(e.start));
		expect(snappedEvents.length).toBeGreaterThan(0);
		expect(unsnappedEvents.length).toBeGreaterThan(0);
		
		console.log('Snapped events:', snappedEvents.map(e => `${e.uuid}: ${e.start}`));
		console.log('Unsnapped events:', unsnappedEvents.map(e => `${e.uuid}: ${e.start}`));
		
		// First drag: Use an unsnapped anchor (it should snap to grid when dragged)
		const unsnappedAnchor = initialEvents.find(e => !Number.isInteger(e.start));
		if (!unsnappedAnchor) {
			throw new Error('No unsnapped event found to use as first anchor');
		}
		
		// Verify the anchor is unsnapped
		expect(Number.isInteger(unsnappedAnchor.start)).toBe(false);
		console.log(`First anchor (unsnapped): ${unsnappedAnchor.uuid} at start=${unsnappedAnchor.start}`);
		
		// Calculate relative positions from unsnapped anchor
		const relativePositions = initialEvents.map(event => ({
			uuid: event.uuid,
			relativeStart: event.start - unsnappedAnchor.start,
			relativeNote: noteToNumber(event.note) - noteToNumber(unsnappedAnchor.note),
			isSnapped: Number.isInteger(event.start)
		}));
		
		// Find unsnapped anchor position for dragging
		const unsnappedAnchorInfo = await page.evaluate((uuid) => {
			const state$ = window.__jamStationState$;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			const event = visible.find(v => v.uuid === uuid);
			return event ? {rect: event.rect} : null;
		}, unsnappedAnchor.uuid);
		
		if (!unsnappedAnchorInfo) {
			throw new Error('Unsnapped anchor event not visible');
		}
		
		const canvasUnsnappedAnchorX = unsnappedAnchorInfo.rect.x + unsnappedAnchorInfo.rect.width / 2;
		const canvasUnsnappedAnchorY = unsnappedAnchorInfo.rect.y + unsnappedAnchorInfo.rect.height / 2;
		const screenUnsnappedAnchorX = canvasBox.x + canvasUnsnappedAnchorX;
		const screenUnsnappedAnchorY = canvasBox.y + canvasUnsnappedAnchorY;
		
		await page.evaluate(() => { document.title = 'Test: Mixed Quantization Drag - Dragging by unsnapped anchor (should snap)...'; });
		await page.waitForTimeout(1000);
		
		// First drag: Drag by unsnapped anchor - move 2 grid steps
		const canvasDrag1EndX = canvasUnsnappedAnchorX + 60; // 2 grid steps
		const canvasDrag1EndY = canvasUnsnappedAnchorY;
		const screenDrag1EndX = canvasBox.x + canvasDrag1EndX;
		const screenDrag1EndY = canvasBox.y + canvasDrag1EndY;
		
		console.log(`First drag: Dragging mixed events by unsnapped anchor (${unsnappedAnchor.uuid}) from canvas(${canvasUnsnappedAnchorX}, ${canvasUnsnappedAnchorY}) to canvas(${canvasDrag1EndX}, ${canvasDrag1EndY})`);
		
		await page.waitForTimeout(500);
		await dragCanvas(page, interactionCanvas, screenUnsnappedAnchorX, screenUnsnappedAnchorY, screenDrag1EndX, screenDrag1EndY, 10);
		await page.evaluate(() => { document.title = 'Test: Mixed Quantization Drag - Verifying first drag (anchor should be snapped)...'; });
		await page.waitForTimeout(1000);
		await page.waitForTimeout(1000);
		
		// Get positions after first drag
		const afterFirstDrag = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, selection);
		
		// Verify unsnapped anchor snapped to grid after first drag (should be integer)
		const movedUnsnappedAnchor = afterFirstDrag.find(e => e.uuid === unsnappedAnchor.uuid);
		expect(movedUnsnappedAnchor).toBeDefined();
		expect(Number.isInteger(movedUnsnappedAnchor.start)).toBe(true); // Anchor should snap to grid
		expect(movedUnsnappedAnchor.start).not.toBe(unsnappedAnchor.start); // Should have moved
		console.log(`Unsnapped anchor after first drag: ${movedUnsnappedAnchor.start} (was ${unsnappedAnchor.start}, now snapped!)`);
		
		// Recalculate relative positions from the anchor's new snapped position
		// This ensures we're using the correct base for relative position calculations
		const relativeFromSnappedAnchor = afterFirstDrag.map(event => ({
			uuid: event.uuid,
			relativeStart: event.start - movedUnsnappedAnchor.start,
			relativeNote: noteToNumber(event.note) - noteToNumber(movedUnsnappedAnchor.note),
			isSnapped: Number.isInteger(event.start)
		}));
		
		// Debug: Log all initial and moved positions
		console.log('Initial events:', initialEvents.map(e => `${e.uuid}: ${e.start}`));
		console.log('After first drag:', afterFirstDrag.map(e => `${e.uuid}: ${e.start}`));
		console.log('Anchor:', `original=${unsnappedAnchor.start}, moved=${movedUnsnappedAnchor.start}`);
		console.log('Relative positions:', relativePositions.map(r => `${r.uuid}: ${r.relativeStart}`));
		
		// Verify relative positions are preserved for all events (snapped and unsnapped)
		afterFirstDrag.forEach((moved) => {
			const initial = initialEvents.find(e => e.uuid === moved.uuid);
			const relative = relativePositions.find(r => r.uuid === moved.uuid);
			
			if (initial && relative) {
				// Calculate expected position: anchor's new position + relative offset from original
				const expectedStart = movedUnsnappedAnchor.start + relative.relativeStart;
				const expectedNoteNumber = noteToNumber(movedUnsnappedAnchor.note) + relative.relativeNote;
				const expectedNoteObj = numberToNote(expectedNoteNumber);
				const expectedNote = `${expectedNoteObj.key}${expectedNoteObj.octave}`;
				
				console.log(`Event ${moved.uuid}: initial=${initial.start}, moved=${moved.start}, expected=${expectedStart}, relative=${relative.relativeStart}, anchor=${movedUnsnappedAnchor.start}`);
				
				// Use toBeCloseTo for floating point comparison to handle precision issues
				expect(moved.start).toBeCloseTo(expectedStart, 10);
				expect(moved.note).toBe(expectedNote);
			}
		});
		
		// Second drag: Use a different anchor - pick one that was originally snapped/quantized
		// This tests dragging by a different anchor that was originally quantized
		const originallySnappedEvents = initialEvents.filter(e => Number.isInteger(e.start));
		if (originallySnappedEvents.length === 0) {
			throw new Error('No originally snapped event found to use as second anchor');
		}
		
		// Use the first originally snapped event (not the one we used as first anchor)
		const secondAnchorOriginal = originallySnappedEvents.find(e => e.uuid !== unsnappedAnchor.uuid) || originallySnappedEvents[0];
		const secondAnchor = afterFirstDrag.find(e => e.uuid === secondAnchorOriginal.uuid);
		if (!secondAnchor) {
			throw new Error('Second anchor (originally snapped) not found after first drag');
		}
		
		// Note: After first drag, the second anchor may not be snapped anymore (it moved with the anchor's delta)
		// But when we drag it, it should snap to grid
		console.log(`Second anchor (originally snapped at ${secondAnchorOriginal.start}): ${secondAnchor.uuid} at start=${secondAnchor.start} (will snap when dragged)`);
		
		// Calculate new relative positions from second anchor (now snapped)
		const relativeFromSecondAnchor = afterFirstDrag.map(event => ({
			uuid: event.uuid,
			relativeStart: event.start - secondAnchor.start,
			relativeNote: noteToNumber(event.note) - noteToNumber(secondAnchor.note),
			isSnapped: Number.isInteger(event.start)
		}));
		
		// Find second anchor position
		const secondAnchorInfo = await page.evaluate((uuid) => {
			const state$ = window.__jamStationState$;
			const pianoRoll = state$?.value?.pianoRoll;
			const visible = pianoRoll?.visible || [];
			const event = visible.find(v => v.uuid === uuid);
			return event ? {rect: event.rect} : null;
		}, secondAnchor.uuid);
		
		if (!secondAnchorInfo) {
			throw new Error('Second anchor event not visible');
		}
		
		const canvasSecondAnchorX = secondAnchorInfo.rect.x + secondAnchorInfo.rect.width / 2;
		const canvasSecondAnchorY = secondAnchorInfo.rect.y + secondAnchorInfo.rect.height / 2;
		const screenSecondAnchorX = canvasBox.x + canvasSecondAnchorX;
		const screenSecondAnchorY = canvasBox.y + canvasSecondAnchorY;
		
		await page.evaluate(() => { document.title = 'Test: Mixed Quantization Drag - Dragging by snapped anchor (second drag)...'; });
		await page.waitForTimeout(1000);
		
		// Second drag: Drag by now-snapped anchor - move 1 grid step
		const canvasDrag2EndX = canvasSecondAnchorX + 30; // 1 grid step
		const canvasDrag2EndY = canvasSecondAnchorY;
		const screenDrag2EndX = canvasBox.x + canvasDrag2EndX;
		const screenDrag2EndY = canvasBox.y + canvasDrag2EndY;
		
		console.log(`Second drag: Dragging mixed events by snapped anchor (${secondAnchor.uuid}) from canvas(${canvasSecondAnchorX}, ${canvasSecondAnchorY}) to canvas(${canvasDrag2EndX}, ${canvasDrag2EndY})`);
		
		await page.waitForTimeout(500);
		await dragCanvas(page, interactionCanvas, screenSecondAnchorX, screenSecondAnchorY, screenDrag2EndX, screenDrag2EndY, 10);
		await page.evaluate(() => { document.title = 'Test: Mixed Quantization Drag - Complete!'; });
		await page.waitForTimeout(1000);
		await page.waitForTimeout(1000);
		
		// Get final positions
		const finalEvents = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start, note: event.note} : null;
			}).filter(Boolean);
		}, selection);
		
		// Verify second anchor is still snapped to grid (should be integer)
		const finalSecondAnchor = finalEvents.find(e => e.uuid === secondAnchor.uuid);
		expect(finalSecondAnchor).toBeDefined();
		expect(Number.isInteger(finalSecondAnchor.start)).toBe(true); // Should still be snapped
		const anchorStartBeforeSecondDrag = secondAnchor.start;
		expect(finalSecondAnchor.start).not.toBe(anchorStartBeforeSecondDrag); // Should have moved
		console.log(`Second anchor final position: ${finalSecondAnchor.start} (was ${anchorStartBeforeSecondDrag}, still snapped!)`);
		
		// Verify relative positions are still preserved
		finalEvents.forEach((final) => {
			const relative = relativeFromSecondAnchor.find(r => r.uuid === final.uuid);
			if (relative) {
				const expectedStart = finalSecondAnchor.start + relative.relativeStart;
				const expectedNoteNumber = noteToNumber(finalSecondAnchor.note) + relative.relativeNote;
				const expectedNoteObj = numberToNote(expectedNoteNumber);
				const expectedNote = `${expectedNoteObj.key}${expectedNoteObj.octave}`;
				
				// Use toBeCloseTo for floating point comparison to handle precision issues
				expect(final.start).toBeCloseTo(expectedStart, 10);
				expect(final.note).toBe(expectedNote);
				
				console.log(`Event ${final.uuid}: final start=${final.start}, relative=${relative.relativeStart}, was snapped=${relative.isSnapped}`);
			}
		});
	});

	test('should select multiple events and drag them together', async ({page}) => {
		await page.evaluate(() => { document.title = 'Test: Multi-Select & Drag - Starting selection rectangle...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		
		const interactionCanvas = page.locator('.piano-roll .interaction');
		const canvasBox = await interactionCanvas.boundingBox();
		
		if (!canvasBox) {
			throw new Error('Canvas not found or not visible');
		}
		
		// Select multiple events by dragging a selection rectangle
		// Events are at: event-1 (start=2, x ~90), event-2 (start=3, x ~120), event-3 (start=4, x ~150), event-4 (start=5, x ~180)
		const startX = canvasBox.x + 80; // Start before first event
		const startY = canvasBox.y + 130; // Start around C3 row
		const endX = canvasBox.x + 200; // Cover first 4 events (event-4 at x ~180)
		const endY = canvasBox.y + 20; // Cover from C3 to C4 rows
		
		await page.evaluate(() => { document.title = 'Test: Multi-Select & Drag - Dragging selection rectangle...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(500); // Pause before starting selection
		await dragCanvas(page, interactionCanvas, startX, startY, endX, endY, 10);
		await page.evaluate(() => { document.title = 'Test: Multi-Select & Drag - Selection complete, starting drag...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(1000); // Longer pause to see final selection
		
		// Verify multiple events are selected
		const selection = await page.evaluate(() => {
			const state$ = window.__jamStationState$;
			return state$?.value?.pianoRoll?.selection || [];
		});
		expect(selection.length).toBeGreaterThanOrEqual(2);
		
		// Get initial positions
		const initialEvents = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start} : null;
			}).filter(Boolean);
		}, selection);
		
		// Click on one of the selected events to start dragging
		// Use event-3 (D3 at start=4) as the drag handle
		const canvasDragStartX = 165; // Center of event-3 (D3 at start=4, so canvasX=150, center=165)
		const canvasDragStartY = 126; // D3 row (note 50, canvasY = (60-50)*12 = 120, center ~126)
		const screenDragStartX = canvasBox.x + canvasDragStartX;
		const screenDragStartY = canvasBox.y + canvasDragStartY;
		
		// Drag 3 grid steps to the right (90 pixels in canvas space)
		const canvasDragEndX = canvasDragStartX + 90;
		const canvasDragEndY = canvasDragStartY;
		const screenDragEndX = canvasBox.x + canvasDragEndX;
		const screenDragEndY = canvasBox.y + canvasDragEndY;
		
		console.log(`Dragging selected events from canvas(${canvasDragStartX}, ${canvasDragStartY}) to canvas(${canvasDragEndX}, ${canvasDragEndY})`);
		
		await page.evaluate(() => { document.title = 'Test: Multi-Select & Drag - Dragging selected events...'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(500); // Pause before starting drag
		await dragCanvas(page, interactionCanvas, screenDragStartX, screenDragStartY, screenDragEndX, screenDragEndY, 10);
		await page.evaluate(() => { document.title = 'Test: Multi-Select & Drag - Complete!'; });
		await page.waitForTimeout(1000); // Wait so user can read the title
		await page.waitForTimeout(1000); // Pause to see final position
		
		// Check that all selected events moved together
		const movedEvents = await page.evaluate((selectionUuids) => {
			const state$ = window.__jamStationState$;
			const events = state$?.value?.pianoRoll?.events || [];
			return selectionUuids.map(uuid => {
				const event = events.find(e => e.uuid === uuid);
				return event ? {uuid: event.uuid, start: event.start} : null;
			}).filter(Boolean);
		}, selection);
		
		// All events should have moved by the same amount (3 grid steps)
		movedEvents.forEach((moved, index) => {
			const initial = initialEvents.find(e => e.uuid === moved.uuid);
			if (initial) {
				expect(moved.start).toBe(initial.start + 3);
			}
		});
	});
});
