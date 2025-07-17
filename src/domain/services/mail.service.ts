export interface IMailService {
    /**
     * Sends a restore password email to the user.
     *
     * @name sendRestorePasswordEmail
     * @param {string} email - The user's email address.
     * @param {string} token - The restore password token.
     * @returns {Promise<void>} A promise that resolves when the email is sent.
     *
     * @example
     * await mailService.sendRestorePasswordEmail('user@example.com', 'restore-token');
     */
    sendRestorePasswordEmail(email: string, token: string): Promise<void>;
}