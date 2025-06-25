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
        .exists().withMessage('Query `page` is required')
        .bail()
        .notEmpty().withMessage('Query `page` cannot be empty')
        .toInt(),
    query('limit')
        .exists().withMessage('Query `limit` is required')
        .bail()
        .notEmpty().withMessage('Query `limit` cannot be empty')
        .toInt(),
];