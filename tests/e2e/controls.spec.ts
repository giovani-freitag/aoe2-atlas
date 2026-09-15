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

    test('the handle sits over the bar it has chosen', async ({ page }) => {
        /*
         * The handle rides in a span the slider places, and that span centres it by shifting half
         * its own width. Give the handle a position of its own and the span has no width to
         * halve, which leaves every stop with the handle half a handle to the right of it.
         */
        const knob = await page.locator('.rail-body__knob').boundingBox();
        const bar = await page.locator(".rail-body__profile span[data-current='true']").boundingBox();

        expect(knob).not.toBeNull();
        expect(bar).not.toBeNull();

        const apart = Math.abs((knob?.x ?? 0) + (knob?.width ?? 0) / 2 - ((bar?.x ?? 0) + (bar?.width ?? 0) / 2));
        expect(apart).toBeLessThanOrEqual(1);
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

    test('the way in goes only where the list is already out', async ({ page, isMobile }) => {
        test.skip(Boolean(isMobile), 'needs a window to resize');

        const opener = page.locator('.rail-body__step.riveted');
        const list = page.locator('.roster');

        /*
         * These two turn at the same step or the filters cannot be reached at all: tied to
         * different ones there was a band of widths — a tablet's — where the button had already
         * gone and the list had not yet arrived.
         */
        await page.setViewportSize({ width: 900, height: 800 });
        await expect(opener).toHaveCount(1);

        await page.setViewportSize({ width: 1100, height: 800 });
        await expect(opener).toHaveCount(0);
        await expect(list).toBeVisible();
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

    test('carried down to a phone width it covers the year rail', async ({ page, isMobile }) => {
        test.skip(Boolean(isMobile), 'starts narrow, so there is no window to shrink');

        await openSettings(page);
        await page.setViewportSize({ width: 380, height: 844 });

        /* The panel the roster was leaving dims too, for as long as it takes to go. */
        await expect(page.locator(".drawer__scrim[data-state='open']")).toBeVisible();

        /*
         * The platform's own modal dialog rode a layer above every z-index on the page, and the
         * panel that replaced it is an ordinary element that has to be told. Left untold, the
         * year rail showed through the panel covering the map: a control in plain sight that
         * could not be touched.
         */
        const rail = await page.locator('.rail').boundingBox();
        const onTop = await page.evaluate(
            (at) => {
                const el = document.elementFromPoint(at.x, at.y);

                return el?.closest('.drawer, .drawer__scrim') !== null;
            },
            { x: (rail?.x ?? 0) + (rail?.width ?? 0) / 2, y: (rail?.y ?? 0) + (rail?.height ?? 0) / 2 },
        );

        expect(onTop).toBe(true);
    });

    test('leaves the year alone as soon as there is room beside it', async ({ page, isMobile }) => {
        test.skip(Boolean(isMobile), 'starts narrow, so there is no window to shrink');

        await openSettings(page);

        /*
         * One step up from a phone the panel stops taking the whole screen. The year is the axis
         * every reading on the map is qualified by, so the moment there is anywhere else for the
         * panel to go, it goes there and leaves the rail out.
         */
        await page.setViewportSize({ width: 600, height: 844 });
        await expect(page.locator('.prefs')).toBeVisible();

        const panel = await page.locator('.prefs').boundingBox();
        const rail = await page.locator('.rail').boundingBox();

        expect((panel?.y ?? 0) + (panel?.height ?? 0)).toBeLessThanOrEqual((rail?.y ?? 0) + 1);
        await expect(page.locator('.rail-body__reading strong')).toBeVisible();
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
