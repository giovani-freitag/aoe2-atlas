import { useTranslation } from 'react-i18next';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { Frontier } from '@/domain/values/frontier.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { expansionOf } from '@/data/expansions.ts';
import { usePalette } from '@/react/hooks/services/use-palette.ts';
import { useText } from '@/react/hooks/services/use-text.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useCivilizationText } from '@/react/hooks/view/use-civilization-text.ts';
import { useFormat } from '@/react/hooks/view/use-format.ts';
import { BottomSheet } from './bottom-sheet.tsx';
import { CivArms } from './civ-arms.tsx';
import { ExpansionFacts, RealmFacts, WonderFacts } from './civ-facts.tsx';
import { contemporaries } from '@/domain/rules/contemporaries.ts';
import { Rivals } from './rivals.tsx';

export interface DetailSheetProps {
    civilization: Civilization;
    /** Its border in the century on screen, or null when it held none. */
    border: RealmBorder | null;
    /** Ground it shared with contemporaries in this century. */
    frontiers: readonly Frontier[];
    onClose: () => void;
}

/**
 * One civilization, in the century the rail is parked on, as a panel beside the map.
 *
 * Everything here is dated. The area is the area it held *then*, the neighbours are the ones it
 * actually had *then*, and when the line on the map was borrowed from another century the panel
 * says which — a reader should never have to wonder what year they are looking at. The wording
 * of all that lives in `civ-facts`, which the phone's deck reads from as well; this file decides
 * only how much of it is on screen at once and in what order.
 */
export function DetailSheet({ civilization, border, frontiers, onClose }: DetailSheetProps) {
    const { t } = useTranslation();
    const palette = usePalette();
    const text = useText();
    const { state } = useAtlas();
    const words = useCivilizationText(civilization);
    const format = useFormat();
    const style = palette.styleOf(civilization.key);
    const neighbours = contemporaries(civilization, frontiers);

    return (
        <BottomSheet
            label={t('sheet.details', { name: words.name })}
            open
            onClose={onClose}
            head={
                <div className="sheet__head--titled" style={{ borderColor: style.colour }}>
                    <div className="sheet__who">
                        <CivArms civilization={civilization} size={44} />
                        <div>
                            <h2>{words.name}</h2>
                            <p className="sheet__region">{text.region(civilization.region)}</p>
                        </div>
                    </div>

                    {/*
                     * Who else stood here is part of the civilization's identity in this century,
                     * so it belongs beside its name rather than at the bottom of the panel.
                     */}
                    <Rivals civilization={civilization} frontiers={neighbours} layout="arms" />
                </div>
            }
        >
            <>
                <section className="card parchment singed">
                    <h3 className="eyebrow">{t('detail.in', { year: format.year(state.year) })}</h3>
                    <RealmFacts civilization={civilization} border={border} />
                    <WonderFacts civilization={civilization} />
                </section>

                {expansionOf(civilization) ? (
                    <section className="card parchment singed">
                        <h3 className="eyebrow">{t('detail.expansion')}</h3>
                        <ExpansionFacts civilization={civilization} />
                    </section>
                ) : null}
            </>
        </BottomSheet>
    );
}
