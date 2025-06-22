import { body, param } from "express-validator";

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

    //* Optional
    body('birth_date').isString().withMessage('Field `age` is invalid or missing'),
    body('phone').isString().withMessage('Field `phone` is invalid or missing')
];

export const sendEmailValidator = [
    //* Required
    body('email').notEmpty().isEmail().withMessage('Field `email` is invalid or missing').normalizeEmail()
];

export const restorePasswordValidator = [
    //* Required
    param('token').notEmpty().isString().withMessage('Param `token` is invalid or missing'),
    body('email').notEmpty().isEmail().withMessage('Field `email` is invalid or missing').normalizeEmail(),
    body('password').notEmpty().isString().withMessage('Field `password` is invalid or missing')
];