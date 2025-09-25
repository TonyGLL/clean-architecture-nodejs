import { body, query } from "express-validator";
import { pageLimitQueryValidator } from "./general.validator";

export const GetCouponsValidator = [
    ...pageLimitQueryValidator,
    query('search').optional().isString().withMessage('Search must be a string').trim().escape()
];

export const CreateCouponValidator = [
    body('code')
        .exists().withMessage('Field `code` is required')
        .bail()
        .notEmpty().withMessage('Field `code` cannot be empty')
        .bail()
        .isString().withMessage('Field `code` must be a string')
        .trim().escape(),
    body('discount_type')
        .exists().withMessage('Field `discount_type` is required')
        .bail()
        .notEmpty().withMessage('Field `discount_type` cannot be empty')
        .bail()
        .isIn(['percentage', 'fixed']).withMessage('Field `discount_type` must be either "percentage" or "fixed"'),
    body('discount_value')
        .exists().withMessage('Field `discount_value` is required')
        .bail()
        .notEmpty().withMessage('Field `discount_value` cannot be empty')
        .bail()
        .isFloat({ gt: 0 }).withMessage('Field `discount_value` must be a number greater than 0')
        .toFloat(),
    body('min_order_amount')
        .optional()
        .isFloat({ gt: 0 }).withMessage('Field `min_order_amount` must be a number greater than 0')
        .toFloat(),
    body('max_discount')
        .optional()
        .isFloat({ gt: 0 }).withMessage('Field `max_discount` must be a number greater than 0')
        .toFloat(),
    body('usage_limit')
        .optional()
        .isInt({ gt: 0 }).withMessage('Field `usage_limit` must be an integer greater than 0')
        .toInt(),
    body('per_client_limit')
        .optional()
        .isInt({ gt: 0 }).withMessage('Field `per_client_limit` must be an integer greater than 0')
        .toInt(),
    body('valid_from')
        .optional()
        .isISO8601().withMessage('Field `valid_from` must be a valid date')
        .toDate(),
    body('valid_until')
        .optional()
        .isISO8601().withMessage('Field `valid_until` must be a valid date')
        .toDate()
];

export const UpdateCouponValidator = [
    body('code')
        .exists().withMessage('Field `code` is required')
        .bail()
        .notEmpty().withMessage('Field `code` cannot be empty')
        .bail()
        .isString().withMessage('Field `code` must be a string')
        .trim().escape(),
    body('discount_type')
        .exists().withMessage('Field `discount_type` is required')
        .bail()
        .notEmpty().withMessage('Field `discount_type` cannot be empty')
        .bail()
        .isIn(['percentage', 'fixed']).withMessage('Field `discount_type` must be either "percentage" or "fixed"'),
    body('discount_value')
        .exists().withMessage('Field `discount_value` is required')
        .bail()
        .notEmpty().withMessage('Field `discount_value` cannot be empty')
        .bail()
        .isFloat({ gt: 0 }).withMessage('Field `discount_value` must be a number greater than 0')
        .toFloat(),
    body('min_order_amount')
        .optional()
        .isFloat({ gt: 0 }).withMessage('Field `min_order_amount` must be a number greater than 0')
        .toFloat(),
    body('max_discount')
        .optional()
        .isFloat({ gt: 0 }).withMessage('Field `max_discount` must be a number greater than 0')
        .toFloat(),
    body('usage_limit')
        .optional()
        .isInt({ gt: 0 }).withMessage('Field `usage_limit` must be an integer greater than 0')
        .toInt(),
    body('per_client_limit')
        .optional()
        .isInt({ gt: 0 }).withMessage('Field `per_client_limit` must be an integer greater than 0')
        .toInt(),
    body('valid_from')
        .optional()
        .isISO8601().withMessage('Field `valid_from` must be a valid date')
        .toDate(),
    body('valid_until')
        .optional()
        .isISO8601().withMessage('Field `valid_until` must be a valid date')
        .toDate(),
    body('active')
        .optional()
        .isBoolean().withMessage('Field `active` must be a boolean')
        .toBoolean()
];