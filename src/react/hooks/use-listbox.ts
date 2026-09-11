import { useCallback, useEffect, useState, type KeyboardEvent, type RefObject } from 'react';

export interface ListboxOptions {
    /** The element holding the button and the list, so a press outside can close it. */
    container: RefObject<HTMLElement | null>;
    /** How many entries the list holds, so the arrow keys can wrap around it. */
    count: number;
    /** Which entry the highlight starts on when the list opens. */
    selected: number;
    onPick: (index: number) => void;
}

export interface Listbox {
    isOpen: boolean;
    /** The entry the keyboard is on, which is not yet the entry chosen. */
    active: number;
    toggle: () => void;
    pick: (index: number) => void;
    onKeyDown: (event: KeyboardEvent) => void;
}

/**
 * The keyboard and focus behaviour a single-choice list has to have.
 *
 * A native `select` gives all of this away for free, and the moment it is replaced in order to
 * be styled, every part of it has to be put back: arrows that move and wrap, Home and End,
 * Enter to take the highlighted entry, Escape to abandon it, and a press anywhere outside to
 * close. Without them the control looks better and works worse.
 *
 * @param options - How long the list is, where it starts, and what to do with a choice.
 * @returns The state the markup needs and the handlers to hang on it.
 */
export function useListbox(options: ListboxOptions): Listbox {
    const { container, count, selected, onPick } = options;
    const [isOpen, setIsOpen] = useState(false);
    const [active, setActive] = useState(selected);

    const toggle = useCallback(() => {
        setActive(selected);
        setIsOpen((open) => !open);
    }, [selected]);

    const pick = useCallback(
        (index: number) => {
            onPick(index);
            setIsOpen(false);
        },
        [onPick],
    );

    useEffect(() => {
        if (!isOpen) return;

        const away = (event: PointerEvent): void => {
            if (!container.current?.contains(event.target as Node)) setIsOpen(false);
        };

        document.addEventListener('pointerdown', away);

        return () => {
            document.removeEventListener('pointerdown', away);
        };
    }, [isOpen, container]);

    const onKeyDown = useCallback(
        (event: KeyboardEvent): void => {
            const step = (delta: number): void => {
                event.preventDefault();
                setIsOpen(true);
                setActive((current) => (current + delta + count) % count);
            };

            if (event.key === 'ArrowDown') {
                step(1);

                return;
            }

            if (event.key === 'ArrowUp') {
                step(-1);

                return;
            }

            if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                setActive(event.key === 'Home' ? 0 : count - 1);

                return;
            }

            /*
             * Escape closes the list and stops there. The panel around it closes on Escape too,
             * and a reader who opened a list by accident means to be rid of the list, not of
             * everything they were doing.
             */
            if (event.key === 'Escape') {
                if (!isOpen) return;

                event.stopPropagation();
                setIsOpen(false);

                return;
            }

            if (isOpen && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                pick(active);
            }
        },
        [active, count, isOpen, pick],
    );

    return { isOpen, active, toggle, pick, onKeyDown };
}
