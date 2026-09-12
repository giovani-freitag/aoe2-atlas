import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Share2 } from 'lucide-react';

/** How long the tick stands in for the icon after a copy, in milliseconds. */
const SHOWN_MS = 1800;

/**
 * Hands the reader a link to exactly what is on the map.
 *
 * The address bar already is that link — the year, the open realm and the pins are written into
 * it as they change — but on a phone the address bar is a swipe away and easy to mistrust, and on
 * a desktop nobody thinks to copy it. So: one button. Where the platform has a share sheet it
 * opens that, with the page's title as the text; everywhere else it copies the address and says
 * so with a tick, which is a quieter thing than a toast and enough for a two-second confirmation.
 */
export function ShareButton() {
    const { t } = useTranslation();
    const [shown, setShown] = useState(false);
    const timer = useRef<number | null>(null);

    useEffect(
        () => () => {
            if (timer.current !== null) window.clearTimeout(timer.current);
        },
        [],
    );

    const share = async (): Promise<void> => {
        const url = window.location.href;

        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: document.title, url });

                return;
            } catch {
                // Dismissed, or the platform refused; the clipboard is the fallback either way.
            }
        }

        try {
            await navigator.clipboard.writeText(url);
        } catch {
            return;
        }

        setShown(true);
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            setShown(false);
        }, SHOWN_MS);
    };

    return (
        <button
            type="button"
            className="iron"
            data-done={shown}
            onClick={() => {
                void share();
            }}
            aria-label={t('map.share')}
            title={t('map.share')}
        >
            {shown ? <Check size={18} aria-hidden /> : <Share2 size={18} aria-hidden />}
            {/* Read out once when the copy lands, without stealing focus from the button. */}
            <span className="sr-only" role="status">
                {shown ? t('map.shared') : ''}
            </span>
        </button>
    );
}
