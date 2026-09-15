import { expect, test, type Page } from '@playwright/test';

/**
 * The controls the atlas is built out of, exercised the way a reader reaches them.
 *
 * Every one of these was a hand-written control before the interface moved onto shared
 * primitives. What they assert is behaviour a reader can name — the year moves, the list
 * reorders, the map redraws — rather than which library is underneath, so they survive the next
 * change of primitive as well.
 */

/** The atlas is ready when the first Wonder is on the map, not when the bundle has parsed. */
const settle = async (page: Page): Promise<void> => {
    await page.waitForSelector('.marker');
    await expect(page.locator('.rail-body__reading strong')).not.toBeEmpty();
};

const openRoster = async (page: Page): Promise<void> => {
    const opener = page.locator('.rail-body__step.riveted');
    if (await opener.isVisible()) await opener.click();
    await expect(page.locator('.roster__list')).toBeVisible();
};

const openSettings = async (page: Page): Promise<void> => {
    await page.click('.bar__settings');
    await expect(page.locator('.prefs')).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await settle(page);
});

test.describe('the year on the rail', () => {
    test('the right arrow steps forward one map', async ({ page }) => {
        const reading = page.locator('.rail-body__reading strong');
        const before = await reading.textContent();

        await page.locator('.rail-body__knob').focus();
        await page.keyboard.press('ArrowRight');

        await expect(reading).not.toHaveText(before ?? '');
    });

    test('Home reaches the first map and End the last', async ({ page }) => {
        const reading = page.locator('.rail-body__reading strong');
        const ends = page.locator('.rail-body__ends span');

        await page.locator('.rail-body__knob').focus();
        await page.keyboard.press('Home');
        await expect(reading).toHaveText((await ends.first().textContent()) ?? '');

        await page.keyboard.press('End');
        await expect(reading).toHaveText((await ends.last().textContent()) ?? '');
    });

    test('the handle announces the year, not the index of the map', async ({ page }) => {
        const reading = await page.locator('.rail-body__reading strong').textContent();

        await expect(page.locator('.rail-body__knob')).toHaveAttribute('aria-valuetext', reading ?? '');
    });
});

test.describe('the roster', () => {
    test('changing the order reorders the list', async ({ page }) => {
        await openRoster(page);
        const first = page.locator('.roster__list li').first().locator('.civ__name');
        const byName = await first.textContent();

        await page.locator('.segmented button').nth(1).click();

        await expect(first).not.toHaveText(byName ?? '');
    });

    test('only one order is ever marked', async ({ page }) => {
        await openRoster(page);

        await page.locator('.segmented button').nth(1).click();

        await expect(page.locator(".segmented button[data-state='on']")).toHaveCount(1);
    });

    test('turning on an expansion filter shortens the list', async ({ page }) => {
        await openRoster(page);
        const rows = page.locator('.roster__list li');
        const before = await rows.count();

        const fold = page.locator('.chips__fold > button');
        if (await fold.isVisible()) await fold.click();
        await page.locator('.chips button').first().click();

        await expect(rows).not.toHaveCount(before);
    });

    test('opening a civilization traces its realm on the map', async ({ page }) => {
        await openRoster(page);
        const realms = page.locator('.atlas__realm');
        const before = await realms.count();

        await page.locator('.roster__list li').first().locator('.civ__main').click();

        await expect(realms).not.toHaveCount(before);
    });
});

test.describe('the preferences', () => {
    test('the ruled switch takes the lines off the map', async ({ page }) => {
        await openSettings(page);
        await expect(page.locator('.atlas__graticule')).toHaveCount(1);

        await page.click('.switch');

        await expect(page.locator('.atlas__graticule')).toHaveCount(0);
    });

    test('changing the projection redraws the world', async ({ page }) => {
        await openSettings(page);
        const land = page.locator('.atlas__land');
        const before = await land.getAttribute('d');

        await page.locator('.options button').nth(1).click();

        await expect(land).not.toHaveAttribute('d', before ?? '');
    });

    test('Escape closes the panel', async ({ page }) => {
        await openSettings(page);

        await page.keyboard.press('Escape');

        await expect(page.locator('.prefs')).toHaveCount(0);
    });

    test('the language can be changed from the keyboard alone', async ({ page }) => {
        await openSettings(page);
        const value = page.locator('.picker__value');
        const before = await value.textContent();

        await page.click('.picker__button');
        await expect(page.locator('.picker__list')).toBeVisible();

        /*
         * The highlight is the thing to wait on, not a clock.
         *
         * The list opens with the current language already highlighted, and moves focus onto
         * whichever entry the highlight lands on — on the next frame. Two keys sent in the same
         * tick therefore commit the entry the first one was still leaving. No hand types that
         * fast, but a test does, so this waits for the highlight to actually move.
         */
        const highlighted = page.locator('.picker__option[data-highlighted]');
        const wasOn = await highlighted.textContent();

        await page.keyboard.press('ArrowDown');
        await expect(highlighted).not.toHaveText(wasOn ?? '');

        await page.keyboard.press('Enter');

        await expect(value).not.toHaveText(before ?? '');
    });

    test('the language list stays on screen', async ({ page }) => {
        await openSettings(page);
        await page.click('.picker__button');

        const list = page.locator('.picker__list');
        const box = await list.boundingBox();
        const size = page.viewportSize();

        expect(box).not.toBeNull();
        expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(size?.width ?? 0);
    });
});

test.describe('the Wikipedia preview', () => {
    /* A card that opens when a pointer rests has nothing to do where there is no pointer; on a
     * phone the link is a link, which is the whole point of hanging the preview over one. */
    test.skip(({ isMobile }) => Boolean(isMobile), 'there is no hover on a touchscreen');

    test('opens above the link and escapes the panel that scrolls', async ({ page }) => {
        await page.goto('/?year=1200&civ=byzantines');
        await settle(page);

        const link = page.locator('.card__link').first();
        await link.hover();

        const card = page.locator('.wiki__card');
        await expect(card).toBeVisible({ timeout: 15_000 });
        await expect(card).toHaveAttribute('data-side', 'top');

        /*
         * The panel it is opened from scrolls, and used to cut the card off at its own edge. The
         * card is wider than the panel on purpose, so this is what says it is no longer trapped.
         */
        const cardBox = await card.boundingBox();
        const panelBox = await page.locator('.sheet--dock').boundingBox();
        expect(cardBox?.width ?? 0).toBeGreaterThan(0);
        if (panelBox) expect((cardBox?.x ?? 0) + (cardBox?.width ?? 0)).toBeGreaterThan(panelBox.width - 1);
    });
});
