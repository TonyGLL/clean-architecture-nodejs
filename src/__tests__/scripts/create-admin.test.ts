// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createAdmin, validatePassword, validateEmail } = require('../../../scripts/create-admin');

type Row = Record<string, unknown>;

/** Minimal pg client fake: answers queries by matching SQL fragments. */
const fakeClient = ({ role = [{ id: 1 }], user = [] as Row[] } = {}) => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const query = jest.fn(async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params });
        if (sql.includes('FROM roles')) return { rowCount: role.length, rows: role };
        if (sql.includes('SELECT id FROM users')) return { rowCount: user.length, rows: user };
        if (sql.includes('INSERT INTO users')) return { rowCount: 1, rows: [{ id: 42 }] };
        return { rowCount: 1, rows: [] };
    });
    return { client: { query } as any, calls };
};

const input = { email: 'Admin@Example.com', password: 'S3cure!pass' };

describe('validatePassword / validateEmail', () => {
    it('accepts a strong password and rejects weak ones listing what is missing', () => {
        expect(validatePassword('S3cure!pass')).toEqual([]);
        expect(validatePassword('weak')).toEqual(['at least 8 characters', 'an uppercase letter', 'a number', 'a symbol']);
        expect(validatePassword(undefined)).not.toEqual([]);
    });

    it('validates emails', () => {
        expect(validateEmail('a@b.co')).toBe(true);
        expect(validateEmail('nope')).toBe(false);
        expect(validateEmail(undefined)).toBe(false);
    });
});

describe('createAdmin', () => {
    it('creates the user with a bcrypt hash and the SuperAdmin role, inside a transaction', async () => {
        const { client, calls } = fakeClient();
        const result = await createAdmin(client, input);

        expect(result).toMatchObject({ userId: 42, created: true, passwordSet: true, role: 'SuperAdmin' });
        const sqls = calls.map(c => c.sql);
        expect(sqls[0]).toBe('BEGIN');
        expect(sqls[sqls.length - 1]).toBe('COMMIT');
        const insertUser = calls.find(c => c.sql.includes('INSERT INTO users'))!;
        expect(insertUser.params![2]).toBe('admin@example.com'); // normalized
        const insertPassword = calls.find(c => c.sql.includes('INSERT INTO passwords'))!;
        expect(insertPassword.params![1]).toMatch(/^\$2[aby]\$10\$.{53}$/); // bcrypt, never the plain text
        expect(insertPassword.params![1]).not.toContain('S3cure');
    });

    it('keeps the existing password unless a reset is requested', async () => {
        const kept = fakeClient({ user: [{ id: 7 }] });
        expect(await createAdmin(kept.client, input)).toMatchObject({ userId: 7, created: false, passwordSet: false });
        expect(kept.calls.some(c => c.sql.includes('INSERT INTO passwords'))).toBe(false);
        expect(kept.calls.some(c => c.sql.includes('INSERT INTO user_roles'))).toBe(true);

        const reset = fakeClient({ user: [{ id: 7 }] });
        expect(await createAdmin(reset.client, { ...input, resetPassword: true })).toMatchObject({ created: false, passwordSet: true });
        expect(reset.calls.some(c => c.sql.includes('INSERT INTO passwords'))).toBe(true);
    });

    it('rolls back and explains when the role does not exist (migrations not run)', async () => {
        const { client, calls } = fakeClient({ role: [] });
        await expect(createAdmin(client, input)).rejects.toThrow('Run "pnpm migrate up" first');
        expect(calls.map(c => c.sql)).toContain('ROLLBACK');
    });

    it('rejects invalid input before touching the database', async () => {
        const { client } = fakeClient();
        await expect(createAdmin(client, { email: 'bad', password: 'S3cure!pass' })).rejects.toThrow('valid email');
        await expect(createAdmin(client, { email: 'a@b.co', password: 'weak' })).rejects.toThrow('ADMIN_PASSWORD');
        expect(client.query).not.toHaveBeenCalled();
    });
});
