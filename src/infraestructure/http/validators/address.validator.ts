import { body, param } from "express-validator";

export const createAddressValidator = [
    body('address_line1').isString(),
    body('address_line2').isString().optional(),
    body('city').isString(),
    body('state').isString(),
    body('postal_code').isString(),
    body('country').isString(),
    body('is_default').isBoolean(),
];

export const updateAddressValidator = [
    param('id').isInt(),
    body('address_line1').isString().optional(),
    body('city').isString().optional(),
    body('state').isString().optional(),
    body('postal_code').isString().optional(),
    body('country').isString().optional(),
    body('is_default').isBoolean().optional(),
];

export const addressIdValidator = [
    param('id').isInt(),
];

export const setDefaultAddressValidator = [
    param('id').isInt(),
];
