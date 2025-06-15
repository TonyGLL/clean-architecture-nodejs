import { body } from "express-validator";

export const loginValidator = [
    //* Required
    body('email').notEmpty().isEmail().withMessage('Field `email` is invalid or missing').normalizeEmail(),
    body('password').notEmpty().isString().withMessage('Field `password` is invalid or missing')
];

export const registerValidator = [
    //* Required
    body('name').notEmpty().isString().withMessage('Field `name` is invalid or missing'),
    body('email').notEmpty().isEmail().withMessage('Field `email` is invalid or missing').normalizeEmail(),
    body('password').notEmpty().isString().withMessage('Field `password` is invalid or missing'),
    body('role').notEmpty().isInt().withMessage('Field `role` is invalid or missing'),

    //* Optional
    body('age').isInt().withMessage('Field `age` is invalid or missing'),
    body('phone').isString().withMessage('Field `phone` is invalid or missing')
];

export const restorePasswordValidator = [
    //* Required
    body('email').notEmpty().isEmail().withMessage('Field `email` is invalid or missing').normalizeEmail()
];