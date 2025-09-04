import { param } from "express-validator";
import { pageLimitQueryValidator } from "./general.validator";

export const GetProductReviewsValidator = [
    //* Required
    ...pageLimitQueryValidator,
    param('productId')
        .exists().withMessage('Param `productId` is required')
        .bail()
        .notEmpty().withMessage('Param `productId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `productId` must be a positive integer')
        .toInt()
];