import { body, query } from "express-validator";
import { idParamValidator, pageLimitQueryValidator } from "./general.validator";

export const GetAllOrdersValidator = [
    ...pageLimitQueryValidator,
    query('search')
        .optional()
        .isString().withMessage('Search must be a string'),
    query('status')
        .optional()
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'succeeded']).withMessage('Status must be one of: pending, processing, shipped, delivered, cancelled, succeeded'),
    query('start_date')
        .optional()
        .isISO8601().withMessage('Start date must be a valid date in ISO 8601 format'),
    query('end_date')
        .optional()
        .isISO8601().withMessage('End date must be a valid date in ISO 8601 format')
];

export const OrderIdValidator = idParamValidator;

export const UpdateOrderStatusValidator = [
    ...idParamValidator,
    body('status')
        .exists().withMessage('Field `status` is required')
        .bail()
        .isIn(['processing', 'shipped', 'delivered']).withMessage('Status must be one of: processing, shipped, delivered')
];
