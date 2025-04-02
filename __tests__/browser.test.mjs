import puppeteer from 'puppeteer';
import path from 'path';
import url from 'url';

let browser;
console.log('Launching browser...');
try {
	browser = await puppeteer.launch({
		headless: 'new',
		args: ['--disable-web-security'],
	});
	const page = await browser.newPage();
	console.log('Page created.');

	// Log all console messages from the page for debugging
	page.on('console', msg => {
		console.log(`PAGE LOG [${msg.type()}]: ${msg.text()}`);
	});

	// Set up error listeners *before* navigation - throw errors directly
	page.once('pageerror', (err) => {
		console.error(`Page error detected: ${err.message}`);
		throw new Error(`Page error: ${err.message}`); // Throw to be caught by top-level catch
	});
	page.once('error', (err) => {
		console.error(`General error detected: ${err.message}`);
		throw new Error(`General error: ${err.message}`); // Throw to be caught by top-level catch
	});

	const filePath = path.resolve(import.meta.dirname, 'browser-test.html');
	const fileUrl = url.pathToFileURL(filePath).toString();
	console.log(`Navigating to: ${fileUrl}`);

	// Navigate and wait for the load event. Errors will propagate up.
	await page.goto(fileUrl, {
		waitUntil: 'load', // Wait for the load event
		timeout: 10000,
	});
	console.log('Navigation and page load completed successfully.');

	console.log(`\n--- Test Passed ---`);
	process.exit(0);
} catch (error) {
	console.error(`\n--- Test Failed ---`);
	// Log the specific error message that caused the failure
	console.error(`Reason: ${error.message}`);
	// Error listeners already logged specific details if it was a page error
	process.exit(1);
} finally {
	// Ensure browser is closed even if errors occurred
	if (browser) {
		console.log('Closing browser...');
		await browser.close();
		console.log('Browser closed.');
	}
}


