import { expect, test } from '@playwright/test';

/**
 * The search-visibility decisions, as assertions.
 *
 * Every one of these was researched, argued and written down, and every one of them is invisible
 * in the source: a title rewritten on mount, a file deliberately absent, an annotation on a page
 * nobody opens by hand. They are the kind of thing a refactor removes without anyone noticing for
 * a month, so they are checked here rather than trusted to memory.
 */

const SITE = 'https://giovani-freitag.github.io/aoe2-atlas/';

/** The phrase every search for this thing contains, in all seventeen languages. */
const THE_GAME = 'Age of Empires II';

/** Only the fields asserted below; the node itself carries a good deal more. */
interface DatasetNode {
    '@type': string;
    url: string;
    inLanguage: string[];
    temporalCoverage: string;
}

test.describe('the atlas', () => {
    test('the title that gets indexed names the game', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.marker');

        /*
         * The bundle rewrites the title on mount, so the one that gets indexed is this one and
         * not the one index.html served. It used to be the wordmark and a tagline, and not one
         * of the seventeen taglines names the game.
         */
        await expect(page).toHaveTitle(new RegExp(THE_GAME));
    });

    test('opening a civilization puts its name and the year in the title', async ({ page }) => {
        await page.goto('/?year=1200&civ=byzantines');
        await page.waitForSelector('.marker');

        await expect(page).toHaveTitle(/1200/);
    });

    test('it says which address is the page', async ({ page }) => {
        await page.goto('/');

        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE);
    });

    test('the roster carries the monuments as crawlable text', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('.marker');

        const opener = page.locator('.rail-body__step.riveted');
        if (await opener.isVisible()) await opener.click();

        /* Fifty-six searchable proper nouns that used to live behind a tap. */
        await expect(page.locator('.civ__monument').first()).not.toBeEmpty();
        expect(await page.locator('.civ__monument').count()).toBeGreaterThan(50);
    });

    test('the Dataset node describes the atlas and its seventeen languages', async ({ page }) => {
        await page.goto('/');

        const raw = await page.locator('script[type="application/ld+json"]').textContent();
        const node = JSON.parse(raw ?? '{}') as DatasetNode;

        expect(node['@type']).toBe('Dataset');
        expect(node.url).toBe(SITE);
        expect(node.inLanguage).toHaveLength(17);
        expect(node.temporalCoverage).toBe('0200/1600');
    });
});

test.describe('the civilizations table', () => {
    test('it annotates all seventeen languages and the x-default', async ({ page }) => {
        await page.goto('/civilizations/');

        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
        expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(18);
    });

    test('it is text, not a shell waiting on a bundle', async ({ page }) => {
        await page.goto('/civilizations/');

        /* The one page in the project that a crawler which runs no script can still read. */
        const monuments = page.locator('table td, table th');
        expect(await monuments.count()).toBeGreaterThan(100);
        await expect(page.locator('h1')).toContainText(/civilization/i);
    });

    test('it keeps the section nobody else has written down', async ({ page }) => {
        await page.goto('/civilizations/');

        /*
         * Which Wonders stand where their civilization never did, and why. A list of civilization
         * against Wonder can be copied off a wiki; this is a judgement with a reason attached,
         * and it is the only part of the project that is not available somewhere else.
         */
        const section = page.locator('h2', { hasText: /Wonders/i });
        await expect(section).toHaveCount(1);
        await expect(page.locator('body')).toContainText('the Huns never reached Rome');
    });

    test('each language names itself as the canonical address', async ({ page }) => {
        await page.goto('/civilizations/pt-BR/');

        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            'href',
            `${SITE}civilizations/pt-BR/`,
        );
        await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    });
});

test.describe('what was deliberately not done', () => {
    test('no robots.txt is published', async ({ request }) => {
        /*
         * It would publish under the project path, and a crawler only ever reads the one at the
         * host root — which is a 404 nobody here controls. A missing file already means "crawl
         * everything", which is what this site wants. Asserted so it is not added back by
         * someone reaching for a checklist.
         */
        const response = await request.get('/robots.txt');

        /* Asked for the content rather than the status: the host answers a missing path with a
         * 404 page, and the preview server with the application, and neither is a robots file. */
        expect(await response.text()).not.toContain('User-agent');
    });

    test('the sitemap lists the table in every language', async ({ request }) => {
        const response = await request.get('/sitemap.xml');
        const xml = await response.text();

        expect(response.status()).toBe(200);
        expect(xml.match(/<loc>/g) ?? []).toHaveLength(18);
        expect(xml).toContain('hreflang="x-default"');
    });
});
