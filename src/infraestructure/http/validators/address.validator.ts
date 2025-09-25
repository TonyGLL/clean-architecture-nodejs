import { body, param } from "express-validator";

export const createAddressValidator = [
    body('address_line1').isString().trim().escape(),
    body('address_line2').isString().optional().trim().escape(),
    body('city').isString().trim().escape(),
    body('state').isString().trim().escape(),
    body('postal_code').isString().trim().escape(),
    body('country').isString().trim().escape(),
    body('is_default').isBoolean(),
];

export const updateAddressValidator = [
    param('id').isInt(),
    body('address_line1').isString().optional().trim().escape(),
    body('address_line2').isString().optional().trim().escape(),
    body('city').isString().optional().trim().escape(),
    body('state').isString().optional().trim().escape(),
    body('postal_code').isString().optional().trim().escape(),
    body('country').isString().optional().trim().escape(),
    body('is_default').isBoolean().optional(),
];

export const addressIdValidator = [
    param('id').isInt(),
];

export const setDefaultAddressValidator = [
    param('id').isInt(),
];
