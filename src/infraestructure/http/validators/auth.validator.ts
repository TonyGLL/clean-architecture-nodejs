import { body, param } from "express-validator";

export const loginValidator = [
    //* Required
    body('email')
        .exists().withMessage('Field `email` is required')
        .bail()
        .notEmpty().withMessage('Field `email` cannot be empty')
        .bail().isEmail().withMessage('Field `email` must be a valid email')
        .normalizeEmail(),
    body('password')
        .exists().withMessage('Field `password` is required')
        .bail()
        .notEmpty().withMessage('Field `password` cannot be empty')
        .bail()
        .isString().withMessage('Field `password` must be a string')
];

export const registerValidator = [
    //* Required
    body('name')
        .exists().withMessage('Field `name` is required')
        .bail()
        .notEmpty().withMessage('Field `name` cannot be empty')
        .bail()
        .isString().withMessage('Field `name` must be a string'),
    body('email')
        .exists().withMessage('Field `email` is required')
        .bail()
        .notEmpty().withMessage('Field `email` cannot be empty')
        .bail()
        .isEmail().withMessage('Field `email` must be a valid email')
        .normalizeEmail(),
    body('password')
        .exists().withMessage('Field `password` is required')
        .bail()
        .notEmpty().withMessage('Field `password` cannot be empty')
        .bail()
        .isString().withMessage('Field `password` must be a string'),

    //* Optional
    body('birth_date')
        .optional()
        .isString().withMessage('Field `birth_date` must be a string'),
    body('phone')
        .optional()
        .isString().withMessage('Field `phone` must be a string')
];

export const sendEmailValidator = [
    //* Required
    body('email')
        .exists().withMessage('Field `email` is required')
        .bail()
        .notEmpty().withMessage('Field `email` cannot be empty')
        .bail()
        .isEmail().withMessage('Field `email` must be a valid email')
        .normalizeEmail()
];

export const restorePasswordValidator = [
    //* Required
    param('token')
        .exists().withMessage('Param `token` is required')
        .bail()
        .notEmpty().withMessage('Param `token` cannot be empty')
        .bail()
        .isString().withMessage('Param `token` must be a string'),
    body('email')
        .exists().withMessage('Field `email` is required')
        .bail()
        .notEmpty().withMessage('Field `email` cannot be empty')
        .bail()
        .isEmail().withMessage('Field `email` must be a valid email')
        .normalizeEmail(),
    body('password')
        .exists().withMessage('Field `password` is required')
        .bail()
        .notEmpty().withMessage('Field `password` cannot be empty')
        .bail()
        .isString().withMessage('Field `password` must be a string')
];
