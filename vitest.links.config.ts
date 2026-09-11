import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * The tests that talk to Wikipedia, kept apart from the rest.
 *
 * They are slow, they need a network, and they fail for reasons nobody here controls — which is
 * everything you do not want in the suite that runs on every save. `npm test` never sees them;
 * `npm run test:links` is where they live.
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/links/**/*.test.ts'],
        testTimeout: 60_000,
        hookTimeout: 60_000,
        // One file, one network conversation: there is nothing to gain from spreading it.
        maxWorkers: 1,
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
