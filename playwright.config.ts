import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end regression, run against the built bundle rather than the dev server.
 *
 * The unit suite covers what can be answered without a browser. These cover the things that only
 * exist once the atlas is assembled: the controls the interface is built out of, and the handful
 * of search-visibility decisions that are invisible in the source and easy to undo by accident.
 */
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://localhost:5174/',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
        { name: 'phone', use: { ...devices['Pixel 7'] } },
    ],
    webServer: {
        command: 'npm run preview',
        url: 'http://localhost:5174/',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
