import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BREAKPOINTS } from '@/react/breakpoints.ts';

const STYLES = ['src/react/styles', 'src/skins'];

/** Every `@media` query in the sheets, with the width it turns at. */
const mediaWidths = (): { file: string; width: string }[] => {
    const found: { file: string; width: string }[] = [];

    const walk = (dir: string): void => {
        for (const entry of readdirSync(dir)) {
            const path = join(dir, entry);
            if (statSync(path).isDirectory()) {
                walk(path);
                continue;
            }
            if (!entry.endsWith('.css')) continue;

            const sheet = readFileSync(path, 'utf8');
            for (const match of sheet.matchAll(/@media[^{]*?\(min-width:\s*([^)]+)\)/g)) {
                found.push({ file: path, width: match[1].trim() });
            }
        }
    };

    for (const dir of STYLES) walk(dir);

    return found;
};

describe('the breakpoint ladder', () => {
    /*
     * The atlas changes shape at more than one width on purpose. The thing to prevent is a part
     * of it changing at a width nobody chose — a stylesheet reaching for a round number that sits
     * a few pixels off a step, so that two parts of the same screen disagree about which layout
     * they are in.
     */
    it('is the only set of widths the stylesheets turn at', () => {
        const allowed = Object.values(BREAKPOINTS).map((rem) => `${rem}rem`);

        const strays = mediaWidths().filter((query) => !allowed.includes(query.width));

        expect(strays).toEqual([]);
    });

    it('is stated in rem, so it moves with the reader’s text size', () => {
        const inPixels = mediaWidths().filter((query) => query.width.endsWith('px'));

        expect(inPixels).toEqual([]);
    });

    it('rises, so a wider window never reaches fewer steps', () => {
        const widths = Object.values(BREAKPOINTS);

        expect(widths).toEqual([...widths].sort((a, b) => a - b));
    });
});
