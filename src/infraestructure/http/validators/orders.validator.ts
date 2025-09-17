import { query } from "express-validator";
import { pageLimitQueryValidator } from "./general.validator";

export const GetAllOrdersValidator = [
    ...pageLimitQueryValidator,
    query('search')
        .optional()
        .isString().withMessage('Search must be a string'),
    query('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'canceled', 'succeeded']).withMessage('Status must be one of: pending, processing, shipped, delivered, canceled, succeeded'),
    query('start_date')
        .optional()
        .isISO8601().withMessage('Start date must be a valid date in ISO 8601 format'),
    query('end_date')
        .optional()
        .isISO8601().withMessage('End date must be a valid date in ISO 8601 format')
];