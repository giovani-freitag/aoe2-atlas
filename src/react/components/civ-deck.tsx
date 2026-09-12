import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Landmark, Package, Scroll, Swords, X } from 'lucide-react';
import type { Civilization } from '@/domain/entities/civilization.ts';
import type { Frontier } from '@/domain/values/frontier.ts';
import type { RealmBorder } from '@/domain/values/realm-border.ts';
import { expansionOf } from '@/data/expansions.ts';
import { useServices } from '@/react/providers/services-context.ts';
import { useAtlas } from '@/react/providers/atlas-context.ts';
import { useCivilizationText } from '@/react/hooks/use-civilization-text.ts';
import { useFormat } from '@/react/hooks/use-format.ts';
import { useMeasuredHeight } from '@/react/hooks/use-measured-height.ts';
import { SheetProviderContext } from '@/react/providers/sheet-context.ts';
import { CivArms } from './civ-arms.tsx';
import { ExpansionFacts, RealmFacts, WonderFacts } from './civ-facts.tsx';
import { contemporaries } from './contemporaries.ts';
import { Rivals } from './rivals.tsx';

/** The height of the bar alone, in pixels, which is what the map frames its realms above. */
export const DECK_BAR = 46;

type Drawerful = 'realm' | 'rivals' | 'wonder' | 'expansion';

export interface CivDeckProps {
    civilization: Civilization;
    border: RealmBorder | null;
    frontiers: readonly Frontier[];
    onClose: () => void;
}

/**
 * The civilization as a bar over the year rail, with one panel out at a time.
 *
 * A spike on the shape Excalidraw uses on a phone: nothing takes the screen. What is always
 * there is a strip of categories, each the size of a thumb; a tap lifts that category's panel
 * over the map and a second tap puts it away. The reader is never more than one tap from the
 * whole map, and never has to remember what was underneath.
 *
 * The sheet it replaces answered every question at once and covered the map to do it. This
 * answers one at a time, and the one being asked is the one on screen. What each answer says is
 * not written here — that is `civ-facts`, which the desktop's panel reads from as well.
 */
export function CivDeck({ civilization, border, frontiers, onClose }: CivDeckProps) {
    const { t } = useTranslation();
    const { palette } = useServices();
    const { state } = useAtlas();
    const words = useCivilizationText(civilization);
    const format = useFormat();
    const [open, setOpen] = useState<Drawerful | null>(null);

    /*
     * The deck publishes its height, panel and all, so the map's own controls can stand on top
     * of it. They live at the foot of the map, which is exactly where the deck now is.
     */
    const deck = useMeasuredHeight<HTMLDivElement>('--deck-height');

    /*
     * Anything inside a panel that acts on the map can put the panel away, and here that means
     * closing the drawer rather than shrinking a sheet. Without this the neighbours traced a
     * realm behind a panel the reader could not see past.
     */
    const sheet = useMemo(() => ({ collapse: () => { setOpen(null); } }), []);

    const style = palette.styleOf(civilization.key);
    const year = format.year(state.year);
    const neighbours = contemporaries(civilization, frontiers);

    /** A category with nothing behind it is not offered; an empty panel is a broken promise. */
    const tabs: { key: Drawerful; icon: typeof Scroll; label: string }[] = [
        { key: 'realm', icon: Scroll, label: t('detail.in', { year }) },
        ...(neighbours.length > 0
            ? [{ key: 'rivals' as const, icon: Swords, label: t('detail.shared', { year }) }]
            : []),
        { key: 'wonder', icon: Landmark, label: t('detail.wonder') },
        ...(expansionOf(civilization)
            ? [{ key: 'expansion' as const, icon: Package, label: t('detail.expansion') }]
            : []),
    ];

    return (
        <div className="deck" ref={deck}>
            {/*
             * The panel says what it is.
             *
             * Nothing tells a reader that a scroll, a pair of swords and a temple are categories
             * until they have tried one — Excalidraw gets away with it because its icons are
             * tools, and a tool shows what it does the moment it is used. A heading here names
             * the icon that opened the panel, so the second tap is an informed one.
             */}
            {open ? (
                <section className="deck__panel parchment">
                    {/*
                     * Whose panel this is, and which of their questions it answers.
                     *
                     * The bar carries the arms and no name, which is enough to know a panel is
                     * open but not enough to read one: a card saying "Eastern Roman Empire,
                     * 407,885 km²" never mentions the Byzantines anywhere, and the realm's name
                     * is often not the civilization's.
                     */}
                    <h2 className="deck__title">
                        {words.name}
                        <small className="eyebrow">{tabs.find((tab) => tab.key === open)?.label}</small>
                    </h2>

                    {open === 'realm' ? (
                        <div className="deck__sheet">
                            <RealmFacts civilization={civilization} border={border} />
                        </div>
                    ) : null}

                    {open === 'rivals' ? (
                        <SheetProviderContext value={sheet}>
                            <Rivals civilization={civilization} frontiers={neighbours} layout="rows" />
                        </SheetProviderContext>
                    ) : null}

                    {open === 'wonder' ? (
                        <div className="deck__sheet">
                            <WonderFacts civilization={civilization} titled />
                        </div>
                    ) : null}

                    {open === 'expansion' ? (
                        <div className="deck__sheet">
                            <ExpansionFacts civilization={civilization} />
                        </div>
                    ) : null}
                </section>
            ) : null}

            {/*
             * The name is not here and the arms carry the identity, which is what they do
             * everywhere else. A toolbar on a phone is read by its buttons; a word in the middle
             * of it only takes the room the buttons wanted.
             */}
            <div
                className="deck__bar leather"
                role="toolbar"
                aria-label={t('sheet.details', { name: words.name })}
                style={{ borderTopColor: style.colour }}
            >
                <CivArms civilization={civilization} size={30} label={words.name} />

                <nav>
                    {tabs.map(({ key, icon: Icon, label }) => (
                        <button
                            key={key}
                            type="button"
                            className="iron"
                            data-active={open === key}
                            aria-expanded={open === key}
                            aria-label={label}
                            title={label}
                            onClick={() => {
                                setOpen((current) => (current === key ? null : key));
                            }}
                        >
                            <Icon size={17} aria-hidden />
                        </button>
                    ))}
                </nav>

                <button type="button" className="deck__close iron" aria-label={t('sheet.close')} onClick={onClose}>
                    <X size={17} aria-hidden />
                </button>
            </div>
        </div>
    );
}
