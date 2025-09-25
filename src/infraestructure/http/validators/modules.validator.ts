import { param, body } from "express-validator";

export const createModuleValidator = [
    body('name')
        .exists().withMessage('Body `name` is required')
        .bail()
        .notEmpty().withMessage('Body `name` cannot be empty')
        .bail()
        .isString().withMessage('Body `name` must be a string')
        .trim().escape(),
    body('description')
        .exists().withMessage('Body `description` is required')
        .bail()
        .notEmpty().withMessage('Body `description` cannot be empty')
        .bail()
        .isString().withMessage('Body `description` must be a string')
        .trim().escape()
];

export const updateModuleValidator = [
    param('id')
        .exists().withMessage('Param `id` is required')
        .bail()
        .notEmpty().withMessage('Param `id` cannot be empty'),
    body('name')
        .optional()
        .notEmpty().withMessage('Body `name` cannot be empty')
        .bail()
        .isString().withMessage('Body `name` must be a string')
        .trim().escape(),
    body('description')
        .optional()
        .notEmpty().withMessage('Body `description` cannot be empty')
        .bail()
        .isString().withMessage('Body `description` must be a string')
        .trim().escape()
];

export const moduleIdValidator = [
    param('id')
        .exists().withMessage('Param `id` is required')
        .bail()
        .notEmpty().withMessage('Param `id` cannot be empty')
];