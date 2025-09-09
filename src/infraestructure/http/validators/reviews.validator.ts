import { body, param } from "express-validator";
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

export const CreateReviewValidator = [
    param('productId')
        .exists().withMessage('Param `productId` is required')
        .bail()
        .notEmpty().withMessage('Param `productId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `productId` must be a positive integer')
        .toInt(),
    body('rating')
        .exists().withMessage('Field `rating` is required')
        .bail()
        .notEmpty().withMessage('Field `rating` cannot be empty')
        .bail()
        .isInt({ min: 1, max: 5 }).withMessage('Field `rating` must be an integer between 1 and 5')
        .toInt(),
    body('body')
        .exists().withMessage('Field `body` is required')
        .bail()
        .isString().withMessage('Field `body` must be a string')
        .bail()
        .notEmpty().withMessage('Field `body` cannot be empty if provided')
        .bail()
        .trim()
];

export const DeleteReviewValidator = [
    param('reviewId')
        .exists().withMessage('Param `reviewId` is required')
        .bail()
        .notEmpty().withMessage('Param `reviewId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `reviewId` must be a positive integer')
        .toInt(),
]

export const ModerateReviewByAdminValidator = [
    param('productId')
        .exists().withMessage('Param `productId` is required')
        .bail()
        .notEmpty().withMessage('Param `productId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `productId` must be a positive integer')
        .toInt(),
    param('status')
        .exists().withMessage('Param `status` is required')
        .bail()
        .notEmpty().withMessage('Param `status` cannot be empty')
        .bail()
        .isIn(['approved', 'rejected']).withMessage('Param `status` must be either "approved" or "rejected"')
]
export const DeleteReviewByAdminValidator = [
    param('reviewId')
        .exists().withMessage('Param `reviewId` is required')
        .bail()
        .notEmpty().withMessage('Param `reviewId` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `reviewId` must be a positive integer')
        .toInt(),
]