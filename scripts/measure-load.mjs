/*
 * Measures what a reader actually waits for, against the built bundle rather than the dev server.
 *
 * Needs `npm run build` and `npm run preview` (port 5174). The throttled profile is the one that
 * matters: on a local preview every byte arrives at once and every number flatters the atlas.
 */
import { chromium } from 'playwright';

const URL_UNDER_TEST = process.env.TARGET ?? 'http://localhost:5174/';

const SLOW_4G = {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
};

/* Two of these isolate a variable: the pair says whether the wait is bytes or work. */
const PROFILES = [
    { name: 'sem throttle', net: null, cpu: 1, detail: false },
    { name: 'só rede lenta (4G, CPU 1x)', net: SLOW_4G, cpu: 1, detail: false },
    { name: 'só CPU lenta (4x, rede plena)', net: null, cpu: 4, detail: false },
    { name: 'Slow 4G + CPU 4x', net: SLOW_4G, cpu: 4, detail: true },
];

const run = async (browser, profile) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);

    await client.send('Network.enable');
    if (profile.net) await client.send('Network.emulateNetworkConditions', { ...profile.net, connectionType: 'cellular4g' });
    if (profile.cpu > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });

    const transfers = [];
    page.on('response', async (response) => {
        const headers = response.headers();
        const size = Number(headers['content-length'] ?? 0);
        transfers.push({ url: response.url(), size, type: response.request().resourceType() });
    });

    const started = Date.now();
    await page.goto(URL_UNDER_TEST, { waitUntil: 'domcontentloaded' });

    // The atlas is usable when the first Wonder is on the map, not when the bundle has parsed.
    await page.waitForSelector('.marker', { timeout: 60000 });
    const usable = Date.now() - started;

    await page.waitForTimeout(1200);

    const paint = await page.evaluate(() => {
        const entry = (name) => performance.getEntriesByName(name)[0]?.startTime ?? null;
        const nav = performance.getEntriesByType('navigation')[0];
        const lcp = performance.getEntriesByType('largest-contentful-paint').at(-1)?.startTime ?? null;

        return {
            fcp: entry('first-contentful-paint'),
            lcp,
            domContentLoaded: nav?.domContentLoadedEventEnd ?? null,
            load: nav?.loadEventEnd ?? null,
            resources: performance.getEntriesByType('resource').map((r) => ({
                name: r.name.split('/').pop(),
                type: r.initiatorType,
                bytes: r.encodedBodySize,
                ms: Math.round(r.duration),
                start: Math.round(r.startTime),
            })),
        };
    });

    await context.close();

    return { profile: profile.name, usable, paint, transfers };
};

const ms = (value) => (value === null ? '   —' : `${Math.round(value)}`.padStart(5) + ' ms');

const browser = await chromium.launch();

const only = process.env.ONLY;

for (const profile of PROFILES.filter((p) => !only || p.name.includes(only))) {
    const result = await run(browser, profile);
    const { paint } = result;

    const bytes = paint.resources.reduce((sum, r) => sum + r.bytes, 0);
    const blocking = paint.resources.filter((r) => r.type === 'link' || r.type === 'script');

    console.log(`\n=== ${result.profile} ===`);
    console.log(`  first contentful paint   ${ms(paint.fcp)}`);
    console.log(`  largest contentful paint ${ms(paint.lcp)}`);
    console.log(`  DOM content loaded       ${ms(paint.domContentLoaded)}`);
    console.log(`  load                     ${ms(paint.load)}`);
    console.log(`  primeiro monumento       ${String(result.usable).padStart(5)} ms   <- atlas utilizável`);
    console.log(`  transferido              ${(bytes / 1024).toFixed(0)} kB em ${paint.resources.length} pedidos`);

    if (profile.detail) {
        console.log('\n  o que pesa, em ordem de chegada:');

        const ordered = paint.resources.sort((a, b) => a.start - b.start);
        const isEmblem = (r) => r.name.endsWith('.webp');
        const emblems = ordered.filter(isEmblem);
        const emblemBytes = Math.round(emblems.reduce((sum, r) => sum + r.bytes, 0) / 1024);

        for (const r of ordered.filter((r) => !isEmblem(r))) {
            console.log(
                `    ${String(r.start).padStart(5)}ms  ${String(Math.round(r.bytes / 1024)).padStart(4)} kB  ${String(r.ms).padStart(5)}ms  ${r.name.slice(0, 44)}`,
            );
        }

        console.log(
            `\n    emblemas: ${emblems.length} pedidos, ${emblemBytes} kB, do ${emblems[0]?.start}ms ao ${emblems.at(-1)?.start}ms`,
        );
        console.log(`  bloqueantes no head: ${blocking.length}`);
    }
}

await browser.close();
