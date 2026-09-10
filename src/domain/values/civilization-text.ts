/** Everything about a civilization that is said in words, in the reader's language. */
export interface CivilizationText {
    name: string;
    /** The real monument the in-game Wonder was modelled on. */
    monument: string;
    /** Where it stands, as a reader would look for it on a map today. */
    place: string;
    country: string;
    /** What the drawn border actually is, named so a reader can go and check it. */
    realm: string;
    /** Why the monument does not belong to the civilization's time or place, when it does not. */
    anachronism: string | null;
}
