import { body } from "express-validator";

export const loginValidator = [
    body('email').notEmpty().isEmail().withMessage('Field `email` is invalid or missing').normalizeEmail(),
    body('email').notEmpty().withMessage('Field `password` is required')
];