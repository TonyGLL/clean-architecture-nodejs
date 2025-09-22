import { body, param } from "express-validator";

export const ProductIdParamValidator = [
    param('productId')
        .exists().withMessage('Param `productId` is required')
        .bail()
        .notEmpty().withMessage('Param `productId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `productId` must be a positive integer')
        .toInt()
];

export const AddProductToCartValidator = [
    ...ProductIdParamValidator,
    body('quantity')
        .exists().withMessage('Field `quantity` is required')
        .bail()
        .notEmpty().withMessage('Field `quantity` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Field `quantity` must be a positive integer')
        .toInt()
];

export const LinkAddressToCartValidator = [
    param('addressId')
        .exists().withMessage('Param `addressId` is required')
        .bail()
        .notEmpty().withMessage('Param `addressId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `addressId` must be a positive integer')
        .toInt()
];

export const DeleteProductFromCart = [
    ...ProductIdParamValidator
];

export const ApplyCouponToCartValidator = [
    param('code')
        .exists().withMessage('Param `code` is required')
        .bail()
        .notEmpty().withMessage('Param `code` cannot be empty')
        .bail()
        .isString().withMessage('Param `code` must be a string')
        .bail()
        .trim()
];