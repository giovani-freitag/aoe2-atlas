import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { drawnRealms } from '@/domain/rules/drawn-realms.ts';
import type { TimeSlice } from '@/services/atlas/slice-service.ts';

import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useCatalogue } from '@/react/hooks/services/use-catalogue.ts';
import { useText } from '@/react/hooks/services/use-text.ts';
import { useTimeSlice } from '@/react/hooks/services/use-time-slice.ts';

export interface AtlasView {
    /** Every civilization the filters leave, whether or not it stood in the year on the rail. */
    listed: readonly Civilization[];
    /** Those of them that actually held ground in the century on screen. */
    standing: readonly Civilization[];
    /** The realms whose border is drawn, in draw order, the focused one last. */
    drawn: readonly Civilization[];
    /** Borders for the century on screen, keyed by civilization. */
    borders: ReadonlyMap<string, RealmBorder>;
    /** The civilization whose panel is open. */
    focused: Civilization | null;
    /** What that civilization is called in the reader's language. */
    focusedName: string | null;
    /** The century on screen, or the last one that loaded while a newer one is on its way. */
    slice: TimeSlice | null;
    loading: boolean;
    failed: boolean;
}

/**
 * Everything on screen, worked out from what the reader has chosen.
 *
 * The one place the roster, the map and the panels are reconciled, so they cannot disagree about
 * which civilizations are being talked about or which of them held ground this century. The shell
 * used to do this between its own hooks and its markup, which put the question "what is on the
 * map" inside a file about layout.
 */
export function useAtlasView(): AtlasView {
    const { i18n } = useTranslation();

    const catalogue = useCatalogue();
    const text = useText();
    const { state } = useAtlas();

    const { slice, loading, failed } = useTimeSlice(state.year);

    const borders = useMemo(() => new Map((slice?.borders ?? []).map((border) => [border.civ, border])), [slice]);

    // The language is a dependency because the names the search matches and sorts by live in it.
    const language = i18n.language;
    const listed = useMemo(
        () => catalogue.search({ text: state.query, expansions: state.expansions, order: state.order }),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the language changes what search returns
        [catalogue, state.query, state.expansions, state.order, language],
    );

    const standing = useMemo(() => listed.filter((civ) => borders.has(civ.key)), [listed, borders]);
    const drawn = useMemo(() => drawnRealms(state, standing), [state, standing]);

    const focused = state.focused ? catalogue.find(state.focused) : null;
    const focusedName = focused ? text.civilization(focused.key, focused.wonder.anachronistic).name : null;

    return { listed, standing, drawn, borders, focused, focusedName, slice, loading, failed };
}
