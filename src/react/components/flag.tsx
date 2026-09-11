import type { ReactNode } from 'react';
import type { SupportedLocale } from '@/i18n/locales.ts';

export interface FlagProps {
    locale: SupportedLocale;
}

/** A five-pointed star of radius one, pointing up, to be placed and scaled by a transform. */
const STAR = 'M0 -1 .225 -.309 .951 -.309 .363 .118 .588 .809 0 .382 -.588 .809 -.363 .118 -.951 -.309 -.225 -.309Z';

/**
 * Each language's flag, drawn rather than fetched.
 *
 * Seventeen flags as emoji would be seventeen different pictures depending on whose operating
 * system is reading them, and as images they would be seventeen more requests for something the
 * size of a thumbnail. Drawn, they weigh nothing and look the same everywhere.
 *
 * They are cut into an 18-pixel disc, so every one of them is simplified to the shapes that
 * still read at that size: the field, the bands, and the one device the eye actually uses to
 * name it. Fine detail — a coat of arms, the spokes of a wheel, fourteen stripes rather than
 * seven — would be a grey smudge, so it is left out.
 */
const FIELDS: Readonly<Record<SupportedLocale, ReactNode>> = {
    en: (
        <>
            <rect width="24" height="24" fill="#f4f6f8" />
            <g fill="#b22234">
                {[0, 3.7, 7.4, 11.1, 14.8, 18.5, 22.2].map((y) => (
                    <rect key={y} y={y} width="24" height="1.85" />
                ))}
            </g>
            <rect width="11" height="9.25" fill="#3c3b6e" />
        </>
    ),
    'pt-BR': (
        <>
            <rect width="24" height="24" fill="#1d9c4a" />
            <path d="M12 3.4 22 12l-10 8.6L2 12z" fill="#f4d31c" />
            <circle cx="12" cy="12" r="4.1" fill="#1c3d8f" />
            <path d="M7.9 11.2c2.8-1 5.5-1 8.2.4" stroke="#fff" strokeWidth="1.1" fill="none" />
        </>
    ),
    es: (
        <>
            <rect width="24" height="24" fill="#c60b1e" />
            <rect y="6" width="24" height="12" fill="#ffc400" />
        </>
    ),
    'es-MX': (
        <>
            <rect width="24" height="24" fill="#ce1126" />
            <rect width="8" height="24" fill="#006847" />
            <rect x="8" width="8" height="24" fill="#f7f7f7" />
            <circle cx="12" cy="12" r="2.4" fill="none" stroke="#8a6a1f" strokeWidth="1.2" />
        </>
    ),
    fr: (
        <>
            <rect width="24" height="24" fill="#ed2939" />
            <rect width="8" height="24" fill="#002395" />
            <rect x="8" width="8" height="24" fill="#f7f7f7" />
        </>
    ),
    de: (
        <>
            <rect width="24" height="8" fill="#111" />
            <rect y="8" width="24" height="8" fill="#dd0000" />
            <rect y="16" width="24" height="8" fill="#ffce00" />
        </>
    ),
    it: (
        <>
            <rect width="24" height="24" fill="#ce2b37" />
            <rect width="8" height="24" fill="#008c45" />
            <rect x="8" width="8" height="24" fill="#f7f7f7" />
        </>
    ),
    pl: (
        <>
            <rect width="24" height="12" fill="#f7f7f7" />
            <rect y="12" width="24" height="12" fill="#dc143c" />
        </>
    ),
    ru: (
        <>
            <rect width="24" height="8" fill="#f7f7f7" />
            <rect y="8" width="24" height="8" fill="#0039a6" />
            <rect y="16" width="24" height="8" fill="#d52b1e" />
        </>
    ),
    tr: (
        <>
            <rect width="24" height="24" fill="#e30a17" />
            <circle cx="10" cy="12" r="5" fill="#fff" />
            <circle cx="11.6" cy="12" r="4" fill="#e30a17" />
            <path d={STAR} fill="#fff" transform="translate(16.6 12) scale(2.3)" />
        </>
    ),
    hi: (
        <>
            <rect width="24" height="8" fill="#ff9933" />
            <rect y="8" width="24" height="8" fill="#f7f7f7" />
            <rect y="16" width="24" height="8" fill="#138808" />
            <circle cx="12" cy="12" r="2.6" fill="none" stroke="#000080" strokeWidth="0.9" />
        </>
    ),
    ja: (
        <>
            <rect width="24" height="24" fill="#f7f7f7" />
            <circle cx="12" cy="12" r="5.6" fill="#bc002d" />
        </>
    ),
    ko: (
        <>
            <rect width="24" height="24" fill="#f7f7f7" />
            <path d="M7 12a5 5 0 0 1 10 0 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 0-5 0" fill="#cd2e3a" />
            <path d="M7 12a5 5 0 0 0 10 0 2.5 2.5 0 0 0-5 0 2.5 2.5 0 0 1-5 0" fill="#0047a0" />
            <g stroke="#111" strokeWidth="1.1" strokeLinecap="round">
                <path d="M3 5.5 5.8 3.2M3 20.6 5.8 18.3M18.2 3.2 21 5.5M18.2 18.3 21 20.6" />
            </g>
        </>
    ),
    ms: (
        <>
            <rect width="24" height="24" fill="#f7f7f7" />
            <g fill="#cc0001">
                {[0, 6.85, 13.7, 20.55].map((y) => (
                    <rect key={y} y={y} width="24" height="3.4" />
                ))}
            </g>
            <rect width="12" height="13.7" fill="#010066" />
            <circle cx="5.6" cy="6.9" r="3.5" fill="#ffcc00" />
            <circle cx="7.1" cy="6.9" r="2.9" fill="#010066" />
            <path d={STAR} fill="#ffcc00" transform="translate(10 7.6) scale(1.9)" />
        </>
    ),
    vi: (
        <>
            <rect width="24" height="24" fill="#da251d" />
            <path d={STAR} fill="#ffff00" transform="translate(12 12) scale(6)" />
        </>
    ),
    'zh-CN': (
        <>
            <rect width="24" height="24" fill="#de2910" />
            <path d={STAR} fill="#ffde00" transform="translate(6.5 7) scale(4)" />
            <path d={STAR} fill="#ffde00" transform="translate(13 3) scale(1.5)" />
            <path d={STAR} fill="#ffde00" transform="translate(16 6.2) scale(1.5)" />
            <path d={STAR} fill="#ffde00" transform="translate(16 10.4) scale(1.5)" />
            <path d={STAR} fill="#ffde00" transform="translate(13 13.4) scale(1.5)" />
        </>
    ),
    'zh-TW': (
        <>
            <rect width="24" height="24" fill="#fe0000" />
            <rect width="12" height="12" fill="#000095" />
            <circle cx="6" cy="6" r="3.6" fill="#fff" />
            <circle cx="6" cy="6" r="2.2" fill="#000095" />
            <circle cx="6" cy="6" r="1.4" fill="#fff" />
        </>
    ),
};

/**
 * The flag of a language, cut into a disc.
 *
 * The clipping is done by the span around it rather than by an SVG clip path, because a clip
 * path needs an id, and the same flag appears twice on screen the moment a list shows the
 * language that is already chosen.
 */
export function Flag({ locale }: FlagProps) {
    return (
        <span className="flag" aria-hidden>
            <svg viewBox="0 0 24 24" focusable="false">
                {FIELDS[locale]}
            </svg>
        </span>
    );
}
