/*
 * Drives two running copies of the atlas through the same steps and reports where they differ.
 *
 * Geometry and computed style are compared as numbers rather than as pixels, because a
 * screenshot diff on a map that draws embers and hatching reports a change on every run. The
 * screenshots are written alongside for a human to look at, with the fire masked out.
 *
 * It needs both copies already serving: one on 5175, one on 5176.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const TARGETS = {
    base: 'http://localhost:5175',
    next: 'http://localhost:5176',
};

const OUT = process.env.COMPARE_OUT ?? './.cache/compare/';

/** Computed properties worth comparing; layout comes from the bounding box instead. */
const STYLES = [
    'display',
    'position',
    'backgroundColor',
    'color',
    'borderTopColor',
    'borderRadius',
    'fontSize',
    'fontFamily',
    'fontWeight',
    'boxShadow',
    'opacity',
    'zIndex',
];

/** A probe reads one element in both builds; `next` covers a selector the migration renamed. */
const p = (name, base, next = base) => ({ name, base, next });

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

const settle = async (page) => {
    await page.waitForSelector('.marker', { timeout: 15000 });
    await page.waitForTimeout(600);
};

const scenarios = [
    {
        name: 'desktop-load',
        viewport: DESKTOP,
        steps: async () => {},
        probes: [
            p('shell', '.shell'),
            p('bar', '.bar'),
            p('stage', '.stage'),
            p('rail', '.rail'),
            p('rail-track', '.rail-body__track'),
            p('rail-fill', '.rail-body__fill'),
            p('rail-reading', '.rail-body__reading strong'),
            p('roster', '.roster'),
            p('roster-filters', '.roster__filters'),
            p('segmented', '.segmented'),
            p('segmented-on', ".segmented button[data-active='true']", ".segmented button[data-state='on']"),
            p('chips', '.chips'),
            p('chip-first', '.chips button:first-child', '.chips button:first-child'),
            p('controls', '.atlas__controls'),
            p('civ-first', '.roster__list li:first-child .civ__main'),
        ],
    },
    {
        name: 'desktop-settings',
        viewport: DESKTOP,
        steps: async (page) => {
            await page.click('.bar__settings');
            await page.waitForSelector('.prefs', { state: 'attached' });
            await page.waitForTimeout(500);
        },
        probes: [
            p('prefs', '.prefs'),
            p('prefs-head', '.prefs .drawer__head'),
            p('picker-button', '.picker__button'),
            p('options', '.options'),
            p('option-on', ".options button[data-active='true']", ".options button[data-state='checked']"),
            p('switch', '.switch'),
            p('switch-track', '.switch__track'),
            p('switch-knob', '.switch__knob'),
            p('project-link', '.drawer__project'),
        ],
    },
    {
        name: 'desktop-select',
        viewport: DESKTOP,
        steps: async (page) => {
            await page.click('.bar__settings');
            await page.waitForSelector('.prefs', { state: 'attached' });
            await page.waitForTimeout(500);
            await page.click('.picker__button');
            await page.waitForTimeout(500);
        },
        probes: [
            p('list', '.picker__list'),
            p('option-first', '.picker__list button:first-of-type', '.picker__option:first-of-type'),
            p('label-first', '.picker__label'),
        ],
    },
    {
        name: 'desktop-civ',
        viewport: DESKTOP,
        // A century and a realm that certainly had neighbours, so the panel is never half empty.
        path: '?year=1200&civ=byzantines',
        steps: async (page) => {
            await page.waitForTimeout(600);
        },
        probes: [
            p('sheet', '.sheet--dock'),
            p('sheet-head', '.sheet__head'),
            p('card-first', '.sheet__body .card:first-child'),
            p('stats', '.stats'),
            p('rivals', '.rivals'),
            p('rivals-first', '.rivals ul li:first-child button'),
            p('rivals-label', '.rivals__label'),
        ],
    },
    {
        name: 'desktop-wiki',
        viewport: DESKTOP,
        path: '?year=1200&civ=byzantines',
        steps: async (page) => {
            await page.waitForTimeout(600);
            await page.hover('.card__link');

            // The dwell, then the article over the network; both builds wait on the same API.
            await page.waitForSelector('.wiki__card', { timeout: 10000 }).catch(() => undefined);
            await page.waitForTimeout(700);
        },
        probes: [
            p('card', '.wiki__card'),
            p('thumb', '.wiki__card img'),
            p('body', '.wiki__body'),
            p('title', '.wiki__body strong'),
            p('extract', '.wiki__extract'),
        ],
    },
    {
        name: 'desktop-traced',
        viewport: DESKTOP,
        steps: async (page) => {
            await page.click(".atlas__controls button[aria-pressed='false']");
            await page.waitForTimeout(700);
        },
        probes: [
            p('legend', '.legend'),
            p('legend-head', '.legend__head'),
            p('legend-body', '.legend__body'),
            p('legend-first', '.legend li:first-child'),
            p('controls', '.atlas__controls'),
            p('traced-on', ".atlas__controls button[aria-pressed='true']"),
        ],
    },
    {
        name: 'phone-load',
        viewport: PHONE,
        steps: async () => {},
        probes: [
            p('shell', '.shell'),
            p('bar', '.bar'),
            p('rail', '.rail'),
            p('rail-track', '.rail-body__track'),
            p('rail-fill', '.rail-body__fill'),
            p('controls', '.atlas__controls'),
        ],
    },
    {
        name: 'phone-roster',
        viewport: PHONE,
        steps: async (page) => {
            await page.click('.rail-body__step.riveted');
            await page.waitForTimeout(600);
        },
        probes: [
            p('drawer', '.roster'),
            p('filters', '.roster__filters'),
            p('fold', '.chips__fold'),
            p('fold-trigger', '.chips__fold > summary', '.chips__fold > button'),
            p('segmented', '.segmented'),
            p('list', '.roster__list'),
        ],
    },
    {
        name: 'phone-deck',
        viewport: PHONE,
        steps: async (page) => {
            await page.click('.rail-body__step.riveted');
            await page.waitForTimeout(500);
            await page.click('.roster__list li:first-child .civ__main');
            await page.waitForTimeout(700);
        },
        probes: [
            p('deck', '.deck'),
            p('deck-bar', '.deck__bar'),
            p('deck-tabs', '.deck__bar nav', '.deck__tabs'),
            p('deck-tab-first', '.deck__bar nav button:first-child', '.deck__tabs button:first-child'),
            p('deck-close', '.deck__close'),
        ],
    },
];

/** Functional checks, run on both and compared as values rather than as pixels. */
const behaviours = [
    {
        name: 'rail: seta direita avança um mapa',
        viewport: DESKTOP,
        run: async (page) => {
            const before = await page.textContent('.rail-body__reading strong');
            await page.focus('.rail-body__track input, .rail-body__knob');
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(400);
            const after = await page.textContent('.rail-body__reading strong');
            return { before: before?.trim(), after: after?.trim(), moved: before !== after };
        },
    },
    {
        name: 'rail: Home vai para o primeiro mapa',
        viewport: DESKTOP,
        run: async (page) => {
            await page.focus('.rail-body__track input, .rail-body__knob');
            await page.keyboard.press('Home');
            await page.waitForTimeout(400);
            return { year: (await page.textContent('.rail-body__reading strong'))?.trim() };
        },
    },
    {
        name: 'ordenacao: trocar para area reordena a lista',
        viewport: DESKTOP,
        run: async (page) => {
            const first = await page.textContent('.roster__list li:first-child .civ__name');
            await page.click('.segmented button:nth-child(2)');
            await page.waitForTimeout(400);
            const after = await page.textContent('.roster__list li:first-child .civ__name');
            return { antes: first?.trim(), depois: after?.trim(), reordenou: first !== after };
        },
    },
    {
        name: 'chips: ligar um filtro reduz a lista',
        viewport: DESKTOP,
        run: async (page) => {
            const before = await page.locator('.roster__list li').count();
            await page.click('.chips button:first-child');
            await page.waitForTimeout(400);
            const after = await page.locator('.roster__list li').count();
            return { antes: before, depois: after, filtrou: after < before };
        },
    },
    {
        name: 'switch: grade desliga as linhas do mapa',
        viewport: DESKTOP,
        run: async (page) => {
            await page.click('.bar__settings');
            await page.waitForSelector('.prefs', { state: 'attached' });
            await page.waitForTimeout(500);
            const before = await page.locator('.atlas__graticule').count();
            await page.click('.switch');
            await page.waitForTimeout(400);
            const after = await page.locator('.atlas__graticule').count();
            return { antes: before, depois: after, desligou: after < before };
        },
    },
    {
        name: 'projecao: trocar redesenha o mapa',
        viewport: DESKTOP,
        run: async (page) => {
            await page.click('.bar__settings');
            await page.waitForSelector('.prefs', { state: 'attached' });
            await page.waitForTimeout(500);
            const before = await page.getAttribute('.atlas__land', 'd');
            await page.click('.options button:nth-child(2)');
            await page.waitForTimeout(600);
            const after = await page.getAttribute('.atlas__land', 'd');
            return { mudou: before !== after, tamanhoAntes: before?.length, tamanhoDepois: after?.length };
        },
    },
    {
        name: 'escape: fecha as preferencias',
        viewport: DESKTOP,
        run: async (page) => {
            await page.click('.bar__settings');
            await page.waitForSelector('.prefs', { state: 'attached' });
            await page.waitForTimeout(500);
            const onScreen = async () =>
                page.evaluate(() => {
                    const prefs = document.querySelector('.prefs');
                    if (!prefs) return false;
                    const box = prefs.getBoundingClientRect();

                    // A closed drawer is still in the tree in the old build; it is simply off screen.
                    return box.right > 0 && box.left < window.innerWidth && box.width > 0;
                });

            const abriu = await onScreen();
            await page.keyboard.press('Escape');
            await page.waitForTimeout(700);
            return { abriu, fechou: !(await onScreen()) };
        },
    },
    {
        name: 'select: teclado escolhe outro idioma',
        viewport: DESKTOP,
        run: async (page) => {
            await page.click('.bar__settings');
            await page.waitForSelector('.prefs', { state: 'attached' });
            await page.waitForTimeout(500);
            const before = (await page.textContent('.picker__value'))?.trim();
            await page.click('.picker__button');
            await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown');

            // One frame between the keys: the highlight moves focus asynchronously, and two
            // presses in the same tick is not something a hand can do anyway.
            await page.waitForTimeout(32);
            await page.keyboard.press('Enter');

            // The language arrives as its own chunk, so wait for the value rather than for a clock.
            await page
                .waitForFunction(
                    (was) => document.querySelector('.picker__value')?.textContent?.trim() !== was,
                    before,
                    { timeout: 5000 },
                )
                .catch(() => undefined);

            const after = (await page.textContent('.picker__value'))?.trim();
            return { antes: before, depois: after, trocou: before !== after };
        },
    },
    {
        name: 'civ: abrir traca o realm no mapa',
        viewport: DESKTOP,
        run: async (page) => {
            const before = await page.locator('.atlas__realm').count();
            await page.click('.roster__list li:first-child .civ__main');
            await page.waitForTimeout(700);
            const after = await page.locator('.atlas__realm').count();
            return { antes: before, depois: after, tracou: after > before };
        },
    },
];

const probe = async (page, selector) =>
    page.evaluate(
        ({ selector, styles }) => {
            const el = document.querySelector(selector);
            if (!el) return null;

            const box = el.getBoundingClientRect();
            const computed = getComputedStyle(el);
            const out = {
                x: Math.round(box.x),
                y: Math.round(box.y),
                w: Math.round(box.width),
                h: Math.round(box.height),
            };
            for (const key of styles) out[key] = computed[key];

            return out;
        },
        { selector, styles: STYLES },
    );

const run = async (browser, target, scenario) => {
    const context = await browser.newContext({ viewport: scenario.viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(`${TARGETS[target]}/${scenario.path ?? ''}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    await scenario.steps(page);

    const readings = {};
    for (const { name, base, next } of scenario.probes) {
        readings[name] = await probe(page, target === 'base' ? base : next);
    }

    await page.screenshot({
        path: `${OUT}${scenario.name}.${target}.png`,
        animations: 'disabled',
        mask: [page.locator('.rail__embers')],
    });

    await context.close();

    return readings;
};

const runBehaviour = async (browser, target, check) => {
    const context = await browser.newContext({ viewport: check.viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text().slice(0, 200));
    });

    await page.goto(TARGETS[target], { waitUntil: 'domcontentloaded' });
    await settle(page);

    let result;
    try {
        result = await check.run(page);
    } catch (error) {
        result = { erro: String(error).split('\n')[0] };
    }

    await context.close();

    return { result, errors };
};

const main = async () => {
    await mkdir(OUT, { recursive: true });
    const browser = await chromium.launch();
    const report = { geometry: [], behaviour: [], errors: [] };

    for (const scenario of scenarios) {
        const base = await run(browser, 'base', scenario);
        const next = await run(browser, 'next', scenario);

        for (const key of Object.keys(base)) {
            const a = base[key];
            const b = next[key];

            if (!a || !b) {
                report.geometry.push({ scenario: scenario.name, probe: key, issue: !a && !b ? 'ausente nos dois' : !a ? 'so no migrado' : 'sumiu no migrado' });
                continue;
            }

            const deltas = {};
            for (const axis of ['x', 'y', 'w', 'h']) {
                if (Math.abs(a[axis] - b[axis]) > 1) deltas[axis] = `${a[axis]} -> ${b[axis]}`;
            }
            for (const style of STYLES) {
                if (a[style] !== b[style]) deltas[style] = `${a[style]} -> ${b[style]}`;
            }
            if (Object.keys(deltas).length > 0) {
                report.geometry.push({ scenario: scenario.name, probe: key, deltas });
            }
        }
    }

    for (const check of behaviours) {
        const base = await runBehaviour(browser, 'base', check);
        const next = await runBehaviour(browser, 'next', check);
        report.behaviour.push({
            name: check.name,
            base: base.result,
            next: next.result,
            igual: JSON.stringify(base.result) === JSON.stringify(next.result),
        });
        if (base.errors.length) report.errors.push({ name: check.name, target: 'base', errors: [...new Set(base.errors)] });
        if (next.errors.length) report.errors.push({ name: check.name, target: 'next', errors: [...new Set(next.errors)] });
    }

    await browser.close();
    await writeFile(`${OUT}report.json`, JSON.stringify(report, null, 2));

    console.log('=== GEOMETRIA / ESTILO: divergencias ===');
    if (report.geometry.length === 0) console.log('  nenhuma');
    for (const row of report.geometry) {
        console.log(`  [${row.scenario}] ${row.probe}: ${row.issue ?? JSON.stringify(row.deltas)}`);
    }

    console.log('\n=== COMPORTAMENTO ===');
    for (const row of report.behaviour) {
        console.log(`  ${row.igual ? 'IGUAL  ' : 'DIVERGE'} ${row.name}`);
        if (!row.igual) {
            console.log(`      base: ${JSON.stringify(row.base)}`);
            console.log(`      next: ${JSON.stringify(row.next)}`);
        }
    }

    console.log('\n=== ERROS DE CONSOLE ===');
    if (report.errors.length === 0) console.log('  nenhum');
    for (const row of report.errors) console.log(`  [${row.target}] ${row.name}: ${row.errors.join(' | ')}`);
};

await main();
