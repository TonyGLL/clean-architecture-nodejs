import 'reflect-metadata';
import { PASSWORD_RESET_PURPOSE, RestorePasswordUseCase } from '../../../application/use-cases/auth.use-case';

const victim = { id: 7, email: 'victim@example.com' };

const build = (tokenPayload: object) => {
    const poolClient = { query: jest.fn().mockResolvedValue(undefined), release: jest.fn() };
    const authRepository = { findByEmail: jest.fn().mockResolvedValue(victim), updatePassword: jest.fn() };
    const userRepository = { findByEmail: jest.fn(), updatePassword: jest.fn() };
    const jwtService = { validateToken: jest.fn().mockReturnValue(tokenPayload), generateToken: jest.fn() };
    const hashingService = { hash: jest.fn().mockResolvedValue('hashed'), compare: jest.fn() };
    const mailService = { sendPasswordChangedEmail: jest.fn(), sendRestorePasswordEmail: jest.fn() };
    const pool = { connect: jest.fn().mockResolvedValue(poolClient) };

    const useCase = new RestorePasswordUseCase(
        authRepository as any, userRepository as any, jwtService as any,
        hashingService as any, mailService as any, pool as any,
    );
    return { useCase, authRepository, mailService };
};

const dto = { email: victim.email, password: 'NewPassw0rd!', token: 'jwt' };

describe('RestorePasswordUseCase', () => {
    it('resets the password when the token was issued for that account', async () => {
        const { useCase, authRepository, mailService } = build({ id: victim.id, purpose: PASSWORD_RESET_PURPOSE });
        await useCase.execute(dto, 'client');
        expect(authRepository.updatePassword).toHaveBeenCalledWith(victim.id, 'hashed');
        expect(mailService.sendPasswordChangedEmail).toHaveBeenCalledWith(victim.email);
    });

    it("rejects a reset token that belongs to a different account (account takeover)", async () => {
        const { useCase, authRepository } = build({ id: 999, purpose: PASSWORD_RESET_PURPOSE });
        await expect(useCase.execute(dto, 'client')).rejects.toMatchObject({ statusCode: 403 });
        expect(authRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects an access token used as a reset token', async () => {
        const { useCase, authRepository } = build({ id: victim.id });
        await expect(useCase.execute(dto, 'client')).rejects.toMatchObject({ statusCode: 403 });
        expect(authRepository.updatePassword).not.toHaveBeenCalled();
    });
});
