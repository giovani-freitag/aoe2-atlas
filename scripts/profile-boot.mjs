/*
 * Where the main thread goes while the atlas boots.
 *
 * Time to first paint is already good; what a reader waits for after it is work, not bytes. This
 * samples the CPU from navigation until the first Wonder is on the map and adds up self time by
 * function, so the answer is a list of names rather than a hunch.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const client = await context.newCDPSession(page);

await client.send('Profiler.enable');
await client.send('Profiler.setSamplingInterval', { interval: 200 });
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await client.send('Profiler.start');

await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.marker', { timeout: 60000 });

const { profile } = await client.send('Profiler.stop');

/* Self time per node, from the sample counts the profiler hands back. */
const byId = new Map(profile.nodes.map((node) => [node.id, node]));
const self = new Map();

for (let i = 0; i < profile.samples.length; i += 1) {
    const delta = profile.timeDeltas[i] ?? 0;
    const node = byId.get(profile.samples[i]);
    if (!node) continue;

    const frame = node.callFrame;
    const file = (frame.url ?? '').split('/').pop() || '(motor)';
    const key = `${frame.functionName || '(anônimo)'} · ${file}`;
    self.set(key, (self.get(key) ?? 0) + delta / 1000);
}

const total = [...self.values()].reduce((sum, value) => sum + value, 0);

console.log(`CPU amostrada até o primeiro monumento: ${Math.round(total)} ms (throttle 4x)\n`);
console.log('  self time  share  função · arquivo');

for (const [key, msTaken] of [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22)) {
    const share = ((msTaken / total) * 100).toFixed(1);
    console.log(`  ${String(Math.round(msTaken)).padStart(6)} ms  ${share.padStart(5)}%  ${key.slice(0, 74)}`);
}

await browser.close();
