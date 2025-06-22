import { query } from "express-validator";

export const GetRolesValidator = [
    //* Required
    query('page').notEmpty().withMessage('Query `page` is invalid or missing'),
    query('limit').notEmpty().withMessage('Query `limit` is invalid or missing'),

    //* Optional
    query('search').trim()
];