// @ts-check
const {defineConfig, devices} = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const isHeaded = process.env.HEADED === 'true';

module.exports = defineConfig({
	testDir: './test',
	testMatch: /.*\.e2e\.test\.js$/,
	/* Run tests in parallel when headless, sequentially when headed for visibility */
	fullyParallel: !isHeaded,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Run tests in parallel when headless, sequentially when headed */
	workers: isHeaded ? 1 : undefined, // Use default workers when headless
	/* Increase timeout for visual debugging in headed mode */
	timeout: isHeaded ? 60000 : 30000,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		/* Default to port 5678 for tests to avoid clashing with dev server on 1234 */
		baseURL: process.env.TEST_PORT ? `http://localhost:${process.env.TEST_PORT}` : 'http://localhost:5678',
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				headless: process.env.HEADED !== 'true',
				viewport: {width: 1920, height: 1080}, // Large viewport to see piano-roll
				// Enable Web Audio API (autoplay and audio context)
				launchOptions: {
					args: [
						'--autoplay-policy=no-user-gesture-required',
						'--disable-features=AutoplayIgnoreWebAudio',
					],
				},
			},
		},
	],

	/* Run your local dev server before starting the tests */
	/* Tests always start their own isolated Parcel process on port 5678 to avoid clashing with dev */
	webServer: {
		command: process.env.TEST_PORT ? `PORT=${process.env.TEST_PORT} pnpm start` : 'PORT=5678 pnpm start',
		url: process.env.TEST_PORT ? `http://localhost:${process.env.TEST_PORT}` : 'http://localhost:5678',
		reuseExistingServer: false, // Always start fresh for isolation
		timeout: 120 * 1000,
	},
});

