#!/usr/bin/env node
/**
 * Script to take a screenshot of the jam-station app
 * Usage: node bin/screenshot.js [url] [output-path]
 */

const {chromium} = require('playwright');
const path = require('path');
const fs = require('fs');

const DEFAULT_URL = 'http://localhost:1234';

// Find next available screenshot index
function getNextScreenshotPath() {
	const screenshotsDir = path.join(__dirname, '..', 'assets', 'screenshots');
	if (!fs.existsSync(screenshotsDir)) {
		fs.mkdirSync(screenshotsDir, {recursive: true});
	}
	
	let index = 1;
	let screenshotPath;
	do {
		screenshotPath = path.join(screenshotsDir, `${index}.png`);
		index++;
	} while (fs.existsSync(screenshotPath) && index < 1000);
	
	return screenshotPath;
}

const DEFAULT_OUTPUT = getNextScreenshotPath();

async function takeScreenshot(url = DEFAULT_URL, outputPath = DEFAULT_OUTPUT) {
	console.log(`Taking screenshot of ${url}...`);
	
	// Ensure output directory exists
	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, {recursive: true});
	}
	
	const browser = await chromium.launch();
	const page = await browser.newPage();
	
	try {
		// Set viewport size for consistent screenshots
		await page.setViewportSize({width: 1920, height: 1080});
		
		// Navigate to the app
		await page.goto(url, {waitUntil: 'networkidle'});
		
		// Wait a bit for the app to fully render
		await page.waitForTimeout(2000);
		
		// Take screenshot
		await page.screenshot({
			path: outputPath,
			fullPage: true
		});
		
		console.log(`✓ Screenshot saved to ${outputPath}`);
	} catch (error) {
		console.error('Error taking screenshot:', error);
		process.exit(1);
	} finally {
		await browser.close();
	}
}

// Get command line arguments
const url = process.argv[2] || DEFAULT_URL;
const output = process.argv[3] || DEFAULT_OUTPUT;

takeScreenshot(url, output);

