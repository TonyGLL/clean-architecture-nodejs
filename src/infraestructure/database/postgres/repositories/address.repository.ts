import { inject } from "inversify";
import { Pool } from "pg";
import { Address } from "../../../../domain/entities/address";
import { IAddressRepository } from "../../../../domain/repositories/address.repository";
import { INFRASTRUCTURE_TYPES } from "../../../ioc/types";

export class PostgresAddressRepository implements IAddressRepository {
    constructor(
        @inject(INFRASTRUCTURE_TYPES.PostgresPool) private pool: Pool
    ) { }

    public async create(clientId: number, address: Omit<Address, 'id'>): Promise<Address> {
        const { address_line1, address_line2, city, state, postal_code, country, is_default } = address;
        const result = await this.pool.query(
            'INSERT INTO addresses (client_id, address_line1, address_line2, city, state, postal_code, country, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [clientId, address_line1, address_line2, city, state, postal_code, country, is_default]
        );
        return result.rows[0];
    }

    public async findById(id: number): Promise<Address | null> {
        const result = await this.pool.query('SELECT * FROM addresses WHERE id = $1 AND deleted = false', [id]);
        return result.rows.length ? result.rows[0] : null;
    }

    public async findByClientId(clientId: number): Promise<Address[]> {
        const result = await this.pool.query('SELECT * FROM addresses WHERE client_id = $1 AND deleted = false', [clientId]);
        return result.rows;
    }

    public async update(id: number, address: Partial<Omit<Address, 'id'>>): Promise<Address> {
        const fields = Object.keys(address).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
        const values = Object.values(address);
        const result = await this.pool.query(
            `UPDATE addresses SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        return result.rows[0];
    }

    public async delete(id: number): Promise<void> {
        await this.pool.query('UPDATE addresses SET deleted = true, updated_at = NOW() WHERE id = $1', [id]);
    }

    public async setDefault(clientId: number, addressId: number): Promise<void> {
        await this.pool.query('UPDATE addresses SET is_default = false WHERE client_id = $1', [clientId]);
        await this.pool.query('UPDATE addresses SET is_default = true WHERE id = $1 AND client_id = $2', [addressId, clientId]);
    }
}
