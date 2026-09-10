/**
 * Ground two realms both covered in the same century.
 *
 * The word is deliberate. The first version of this atlas called any overlap a dispute, and
 * reported that the Mongols and the Sasanians fought over ninety per cent of Persia — seven
 * hundred years apart. A frontier only exists between contemporaries, so these are only ever
 * built inside a single time slice.
 */
export class Frontier {
    public readonly a: string;
    public readonly b: string;
    public readonly areaKm2: number;
    private readonly shares: Readonly<Record<string, number>>;

    constructor(config: { a: string; b: string; areaKm2: number; shareOfA: number; shareOfB: number }) {
        this.a = config.a;
        this.b = config.b;
        this.areaKm2 = config.areaKm2;
        this.shares = { [config.a]: config.shareOfA, [config.b]: config.shareOfB };
    }

    /**
     * How much of one realm the shared ground accounts for.
     *
     * @param civ - Either of the two civilizations.
     * @returns A fraction between zero and one; zero when the civilization is not in this pair.
     */
    public shareOf(civ: string): number {
        return this.shares[civ] ?? 0;
    }

    /**
     * The other civilization in the pair.
     *
     * @param civ - One of the two.
     * @returns The other one, or null when the given key is in neither side.
     */
    public otherThan(civ: string): string | null {
        if (civ === this.a) return this.b;
        if (civ === this.b) return this.a;

        return null;
    }

    /** True when one realm sits almost wholly inside the other. */
    public get isNested(): boolean {
        return Math.max(this.shares[this.a], this.shares[this.b]) > 0.9;
    }
}
