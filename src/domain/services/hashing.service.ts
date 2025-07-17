export interface IHashingService {
    /**
     * Hashes a plain text string.
     *
     * @name hash
     * @param {string} plainText - The plain text to hash.
     * @returns {Promise<string>} A promise that resolves with the hashed text.
     *
     * @example
     * const hashedPassword = await hashingService.hash('my-secret-password');
     */
    hash(plainText: string): Promise<string>;

    /**
     * Compares a plain text string with a hashed text.
     *
     * @name compare
     * @param {string} plainText - The plain text to compare.
     * @param {string} hashedText - The hashed text to compare against.
     * @returns {Promise<boolean>} A promise that resolves with true if the plain text matches the hashed text, false otherwise.
     *
     * @example
     * const isMatch = await hashingService.compare('my-secret-password', hashedPassword);
     */
    compare(plainText: string, hashedText: string): Promise<boolean>;
}