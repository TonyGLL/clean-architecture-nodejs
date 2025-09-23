import { body, param } from "express-validator";

export const createWishlistValidator = [
    body('name')
        .exists().withMessage('Body `name` is required')
        .bail()
        .notEmpty().withMessage('Body `name` cannot be empty')
        .bail()
        .isString().withMessage('Body `name` must be a string')
];

export const updateWishlistValidator = [
    param('id')
        .exists().withMessage('Param `id` is required')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `id` must be a positive integer')
        .toInt(),
    body('name')
        .exists().withMessage('Body `name` is required')
        .bail()
        .notEmpty().withMessage('Body `name` cannot be empty')
        .bail()
        .isString().withMessage('Body `name` must be a string')
];

export const addProductToWishlistValidator = [
    param('id')
        .exists().withMessage('Param `id` is required')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `id` must be a positive integer')
        .toInt(),
    body('productId')
        .exists().withMessage('Body `productId` is required')
        .bail()
        .isInt({ min: 1 }).withMessage('Body `productId` must be a positive integer')
        .toInt()
];
