import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        clearMocks: true,
        // Component tests opt into jsdom with a `@vitest-environment jsdom` docblock of their own.
        environment: 'node',
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
        // The Wikipedia checks need a network and a minute; they run from vitest.links.config.ts.
        exclude: ['tests/links/**'],
        /*
         * One context for the whole suite instead of one per file.
         *
         * Nothing here writes global state — the mocks are per-test factories and the fixtures
         * are pure — so the isolation was buying nothing and costing a fresh module graph per
         * file, which is where almost all of the wall clock went.
         */
        isolate: false,
        // Threads start faster than forks, and with isolation off there is nothing to fork for.
        pool: 'threads',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/domain/**', 'src/services/**'],
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
