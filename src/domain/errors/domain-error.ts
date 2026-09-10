/** Raised when the data handed to the domain cannot describe anything real. */
export class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}
