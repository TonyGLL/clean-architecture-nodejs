import { param, query } from "express-validator";

export const idParamValidator = [
    //* Required
    param('id')
        .exists().withMessage('Param `id` is required')
        .bail()
        .notEmpty().withMessage('Param `id` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `id` must be a positive integer')
        .toInt()
];

export const pageLimitQueryValidator = [
    query('page')
        .exists().withMessage('Query param `page` is required')
        .bail()
        .isInt({ min: 0 }).withMessage('Page must be a non-negative integer')
        .bail()
        .notEmpty().withMessage('Query `page` cannot be empty')
        .toInt(),
    query('limit')
        .exists().withMessage('Query param `limit` is required')
        .bail()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100')
        .bail()
        .notEmpty().withMessage('Query `limit` cannot be empty')
        .toInt()
];