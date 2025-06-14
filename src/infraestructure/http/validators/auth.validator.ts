import { body } from "express-validator";

export const loginValidator = [
    body('email').notEmpty().isEmail().withMessage('Field `email` is invalid or missing').normalizeEmail(),
    body('password').notEmpty().withMessage('Field `password` is required')
];

export const registerValidator = [
    body('email').notEmpty().isEmail().withMessage('Field `email` is invalid or missing').normalizeEmail(),
    body('password').notEmpty().withMessage('Field `password` is required'),
    body('role').notEmpty().withMessage('Field `password` is required'),
];