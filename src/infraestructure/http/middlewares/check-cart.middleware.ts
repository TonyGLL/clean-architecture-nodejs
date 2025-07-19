import { Request, Response, NextFunction } from 'express';
import pool from '../../database/postgres/config';
import { HttpStatusCode } from '../../../domain/shared/http.status';
import { HttpError } from '../../../domain/errors/http.error';

export const checkCartMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.user.id as number;

    if (!clientId) throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Invalid or missing client ID.');

    try {
        const result = await pool.query(
            `SELECT sc.shipping_address_id
                FROM shopping_carts sc
                LEFT JOIN addresses a ON sc.shipping_address_id = a.id
                WHERE sc.client_id = $1 AND a.deleted <> TRUE AND sc.status = 'active'`,
            [clientId]
        );

        if (result.rowCount === 0) throw new HttpError(HttpStatusCode.NOT_FOUND, 'Shopping cart not found.');

        const { shipping_address_id } = result.rows[0];

        if (!shipping_address_id) throw new HttpError(HttpStatusCode.UNPROCESSABLE_ENTITY, 'Valid shipping address is required for this cart.');

        next();
    } catch (error) {
        if (error instanceof HttpError) {
            throw new HttpError(error.statusCode, error.message);
        }
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error.' });
    }
};
