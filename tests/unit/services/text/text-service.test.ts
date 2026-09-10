import { describe, expect, it, vi } from 'vitest';
import { TextService } from '@/services/text/text-service.ts';

describe('TextService', () => {
    it('reads every field of a civilization from the atlas bundle', () => {
        const translate = vi.fn((key: string) => key.split('.').pop() ?? '');
        const text = new TextService({ translate, language: () => 'en' });

        const words = text.civilization('mongols', false);

        expect(words).toEqual({
            name: 'name',
            monument: 'monument',
            place: 'place',
            country: 'country',
            realm: 'realm',
            anachronism: null,
        });
        expect(translate).toHaveBeenCalledWith('atlas:civs.mongols.name');
    });

    it('only asks for the anachronism when the records flag one', () => {
        const translate = vi.fn(() => 'says so');
        const text = new TextService({ translate, language: () => 'en' });

        const words = text.civilization('huns', true);

        expect(words.anachronism).toBe('says so');
        expect(translate).toHaveBeenCalledWith('atlas:civs.huns.anachronism');
    });

    it('joins name, monument, place, country and realm into the searchable text', () => {
        const text = new TextService({ translate: (key) => key.split('.').pop() ?? '', language: () => 'en' });

        const searchable = text.searchable('britons');

        expect(searchable).toBe('name monument place country realm');
    });

    it('reports the language in force', () => {
        const text = new TextService({ translate: () => '', language: () => 'ja' });

        const locale = text.locale();

        expect(locale).toBe('ja');
    });
});
