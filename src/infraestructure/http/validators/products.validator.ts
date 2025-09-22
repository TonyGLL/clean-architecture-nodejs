import { param, query } from "express-validator";
import { pageLimitQueryValidator } from "./general.validator";

export const SearchProductsValidator = [
    ...pageLimitQueryValidator,
    query('search')
        .optional()
        .notEmpty().withMessage('Search cannot be empty')
        .bail()
        .isString().withMessage('Search must be a string')
];

export const GetProductDetailsValidator = [
    param('productId')
        .exists().withMessage('Param `productId` is required')
        .bail()
        .notEmpty().withMessage('Param `productId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `productId` must be a positive integer')
        .toInt()
];

export const GetProductsByCategoryValidator = [
    ...pageLimitQueryValidator,
    param('categoryId')
        .exists().withMessage('Param `categoryId` is required')
        .bail()
        .notEmpty().withMessage('Param `categoryId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `categoryId` must be a positive integer')
        .toInt()
];