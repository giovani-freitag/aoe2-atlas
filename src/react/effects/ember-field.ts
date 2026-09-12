export interface EmberFieldConfig {
    canvas: HTMLCanvasElement;
    /** Embers per ten thousand square pixels; one is the calm setting. */
    density?: number;
    /** How hard the air pushes sideways; one is a light draught. */
    wind?: number;
    /** Answers whether the surface underneath is currently light. */
    isLight: () => boolean;
    /**
     * Keeps new embers inside one part of the canvas, such as the handle of a slider.
     *
     * `base` is the line the fire burns on. Without it the coals sit on the floor of the canvas,
     * which is right for a banner and wrong for a rail where the thing alight is halfway up.
     */
    column?: () => { from: number; width: number; base?: number };
}

interface Ember {
    x: number;
    y: number;
    size: number;
    rise: number;
    sway: number;
    phase: number;
    beat: number;
    heat: number;
    drift: number;
}

const AREA_PER_EMBER = 2600;

/**
 * How many embers a column carries, at the calm setting.
 *
 * Seven was a handful of sparks, which is a hint of a fire rather than a fire. A brazier is a
 * crowd: enough of them overlapping that the bloom of one meets the bloom of the next.
 */
const EMBERS_PER_COLUMN = 24;
/** How far below the canvas the unseen fire sits, in pixels. */
const GLOW_DEPTH = 70;

const MAX_PIXEL_RATIO = 2;

/** No banner is wider than this; anything beyond it is a layout mistake, not a request. */
const MAX_SIDE = 4096;
const FRAME = 1 / 60;

/**
 * The embers that drift up over the forge.
 *
 * Nothing here knows about the interface framework: the field owns a canvas, and whoever created
 * it decides when to measure and when to advance a frame.
 */
export class EmberField {
    private readonly config: EmberFieldConfig;
    private readonly paint: CanvasRenderingContext2D;
    private readonly embers: Ember[] = [];
    private width = 0;
    private height = 0;
    private clock = 0;

    constructor(config: EmberFieldConfig) {
        const paint = config.canvas.getContext('2d');
        if (!paint) throw new Error('This browser refused a 2d canvas for the ember field.');

        this.config = config;
        this.paint = paint;
        this.measure();
    }

    /** Matches the drawing buffer to the size the page gave the canvas. */
    public measure(): void {
        const ratio = Math.min(devicePixelRatio || 1, MAX_PIXEL_RATIO);
        const box = this.config.canvas.getBoundingClientRect();

        this.width = Math.min(box.width, MAX_SIDE);
        this.height = Math.min(box.height, MAX_SIDE);
        this.config.canvas.width = Math.max(1, Math.round(this.width * ratio));
        this.config.canvas.height = Math.max(1, Math.round(this.height * ratio));
        this.paint.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.embers.length = 0;
    }

    /** Advances every ember one frame and repaints the canvas. */
    public step(): void {
        this.paint.clearRect(0, 0, this.width, this.height);
        if (this.width < 1 || this.height < 1) return;

        this.clock += FRAME;
        this.fill();

        const light = this.config.isLight();
        this.paint.globalCompositeOperation = light ? 'source-over' : 'lighter';

        this.hearth(light);
        for (const ember of this.embers) this.advance(ember, light);

        this.paint.globalCompositeOperation = 'source-over';
    }

    /** Clears the canvas, for when the effect is switched off. */
    public clear(): void {
        this.paint.clearRect(0, 0, this.width, this.height);
    }

    /**
     * The coals the embers come off, breathing slowly and unevenly.
     *
     * Sparks on their own read as sparks from nowhere. What makes a fire is the bed underneath
     * it, and where that bed is depends on what the field was given: a column puts it under that
     * column, and no column lays it along the bottom edge — something burning off the screen,
     * below the last band of the interface, throwing its light up onto it.
     *
     * Two beats of different speeds rather than one, because a real fire never pulses on a count.
     */
    private hearth(light: boolean): void {
        const breath = 0.78 + 0.14 * Math.sin(this.clock * 1.7) + 0.08 * Math.sin(this.clock * 4.3 + 1.1);
        const column = this.config.column?.();

        if (column && column.width > 0) {
            const middle = column.from + column.width / 2;
            const base = column.base ?? this.height;
            const reach = column.width * 0.72;

            this.wash(this.paint.createRadialGradient(middle, base, 0, middle, base, reach), breath, light);
            this.paint.beginPath();
            this.paint.arc(middle, base, reach, 0, Math.PI * 2);
            this.paint.fill();

            return;
        }

        /*
         * The fire is below the screen, not against it.
         *
         * Starting the gradient at the canvas floor put the hottest part of it right on the edge,
         * which reads as a strip of orange rather than as a light from somewhere. Beginning it
         * well below means only the tail of the glow ever shows, and the source stays off stage
         * where it belongs.
         */
        const below = this.height + GLOW_DEPTH;

        this.wash(this.paint.createLinearGradient(0, below, 0, this.height * 0.05), breath, light);
        this.paint.fillRect(0, 0, this.width, this.height);
    }

    /** The colours of a fire seen through whatever stands in front of it, hot end first. */
    private wash(glow: CanvasGradient, breath: number, light: boolean): void {
        if (light) {
            glow.addColorStop(0, `rgb(226 96 24 / ${(0.2 * breath).toFixed(3)})`);
            glow.addColorStop(0.5, `rgb(214 74 18 / ${(0.08 * breath).toFixed(3)})`);
            glow.addColorStop(1, 'rgb(214 74 18 / 0%)');
        } else {
            glow.addColorStop(0, `rgb(255 172 74 / ${(0.3 * breath).toFixed(3)})`);
            glow.addColorStop(0.4, `rgb(255 116 26 / ${(0.1 * breath).toFixed(3)})`);
            glow.addColorStop(1, 'rgb(255 100 18 / 0%)');
        }

        this.paint.fillStyle = glow;
    }

    private fill(): void {
        const density = this.config.density ?? 1;
        const wanted = this.config.column
            ? Math.round(EMBERS_PER_COLUMN * density)
            : Math.round(((this.width * this.height) / AREA_PER_EMBER) * density);

        while (this.embers.length < wanted) this.embers.push(this.spawn(true));
        while (this.embers.length > wanted) this.embers.pop();
    }

    private spawn(seeded: boolean): Ember {
        const brisk = this.config.column !== undefined;
        const size = brisk ? 0.5 + Math.random() ** 2 * 1.6 : 0.5 + Math.random() ** 2 * 2.1;
        const column = this.config.column?.() ?? { from: 0, width: this.width };

        /*
         * Thickest in the middle of the column, thinning towards its edges.
         *
         * Two rolls averaged rather than one is a triangle instead of a flat line, which is what
         * a fire looks like from above: a heart with sparks straying off it, not a rectangle of
         * evenly scattered dots.
         */
        const across = brisk ? (Math.random() + Math.random()) / 2 : Math.random();

        return {
            x: column.from + across * column.width,
            y: brisk
                ? (column.base ?? this.height) - (seeded ? Math.random() * this.height : -Math.random() * 6)
                : seeded
                  ? Math.random() * this.height
                  : this.height + Math.random() * 8,
            size,
            rise: (brisk ? 0.3 : 0.16) + size * 0.055 + Math.random() * 0.16,
            sway: 0.4 + Math.random() * 1.1,
            phase: Math.random() * Math.PI * 2,
            beat: 0.5 + Math.random() * 2.4,
            heat: brisk ? 0.6 + Math.random() * 0.4 : 0.45 + Math.random() * 0.55,
            drift: (Math.random() - 0.5) * 0.14,
        };
    }

    private advance(ember: Ember, light: boolean): void {
        const wind = this.config.wind ?? 1;

        ember.y -= ember.rise;
        ember.x +=
            Math.sin(ember.y * 0.017 + this.clock * 0.55 + ember.phase) * 0.22 * ember.sway * wind +
            ember.drift * wind;

        if (ember.y < -6 || ember.x < -12 || ember.x > this.width + 12) {
            Object.assign(ember, this.spawn(false));

            return;
        }

        const climb = 1 - ember.y / this.height;
        const fade = Math.min(1, climb * 3.2) * Math.min(1, (1 - climb) * 2.6 + 0.25);
        const flicker = 0.62 + 0.38 * Math.sin(this.clock * ember.beat * 3 + ember.phase);
        const alpha = Math.max(0, ember.heat * fade * flicker);
        if (alpha < 0.015) return;

        this.draw(ember, alpha, light);
    }

    /**
     * Paints one ember as a light source: a bloom, a saturated body, and a hot core.
     *
     * Over dark metal the bloom is enough. Over paper it is not — a spark reads there because its
     * middle is brighter than the page while its rim stays orange, so the core is painted almost
     * white and the body carries the colour.
     */
    private draw(ember: Ember, alpha: number, light: boolean): void {
        const warm = 150 + Math.round(ember.heat * 90);
        const bloom = ember.size * (light ? 4.6 : 5.5);
        const halo = this.paint.createRadialGradient(ember.x, ember.y, 0, ember.x, ember.y, bloom);

        if (light) {
            halo.addColorStop(0, `rgb(228 96 24 / ${(alpha * 0.34).toFixed(3)})`);
            halo.addColorStop(0.55, `rgb(214 74 18 / ${(alpha * 0.14).toFixed(3)})`);
            halo.addColorStop(1, 'rgb(214 74 18 / 0%)');
        } else {
            halo.addColorStop(0, `rgb(255 ${warm} 70 / ${(alpha * 0.42).toFixed(3)})`);
            halo.addColorStop(1, 'rgb(255 120 30 / 0%)');
        }

        this.paint.fillStyle = halo;
        this.paint.beginPath();
        this.paint.arc(ember.x, ember.y, bloom, 0, Math.PI * 2);
        this.paint.fill();

        if (light) {
            this.paint.fillStyle = `rgb(243 ${96 + Math.round(ember.heat * 44)} 22 / ${Math.min(
                1,
                alpha * 1.25,
            ).toFixed(3)})`;
            this.paint.beginPath();
            this.paint.arc(ember.x, ember.y, ember.size * 1.05, 0, Math.PI * 2);
            this.paint.fill();
        }

        this.paint.fillStyle = light
            ? `rgb(255 ${232 + Math.round(ember.heat * 18)} 190 / ${Math.min(1, alpha * 1.15).toFixed(3)})`
            : `rgb(255 ${Math.min(255, 205 + Math.round(ember.heat * 50))} 165 / ${Math.min(1, alpha * 1.25).toFixed(
                  3,
              )})`;
        this.paint.beginPath();
        this.paint.arc(ember.x, ember.y, ember.size * (light ? 0.48 : 0.62), 0, Math.PI * 2);
        this.paint.fill();
    }
}
