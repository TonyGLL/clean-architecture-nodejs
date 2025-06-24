import { body, param, query } from "express-validator";

export const GetRolesValidator = [
    //* Required
    query('page')
        .exists().withMessage('Query `page` is required')
        .bail()
        .notEmpty().withMessage('Query `page` cannot be empty')
        .toInt(),
    query('limit')
        .exists().withMessage('Query `limit` is required')
        .bail()
        .notEmpty().withMessage('Query `limit` cannot be empty')
        .toInt(),

    //* Optional
    query('search')
        .optional()
        .trim()
];

export const GetPermissionsByRoleValidator = [
    //* Required
    param('id')
        .exists().withMessage('Param `id` is required')
        .bail()
        .notEmpty().withMessage('Param `id` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `id` must be a positive integer')
        .toInt()
];

export const CreateRoleValidator = [
    //* Required
    body('name')
        .exists().withMessage('Field `name` is required')
        .bail()
        .isString().withMessage('Field `name` must be a string')
        .bail()
        .notEmpty().withMessage('Field `name` cannot be empty'),
    body('description')
        .exists().withMessage('Field `description` is required')
        .bail()
        .isString().withMessage('Field `description` must be a string'),
    body('permissions')
        .exists().withMessage('Field `permissions` is required')
        .bail()
        .isArray({ min: 1 }).withMessage('Field `permissions` must be a non-empty array'),
    body('permissions.*.module_id')
        .exists().withMessage('Field `module_id` is required')
        .bail()
        .isInt().withMessage('Field `module_id` must be an integer')
        .toInt(),
    body('permissions.*.module_name')
        .exists().withMessage('Field `module_name` is required')
        .bail()
        .isString().withMessage('Field `module_name` must be a string')
        .bail()
        .notEmpty().withMessage('Field `module_name` cannot be empty'),
    body('permissions.*.can_write')
        .exists().withMessage('Field `can_write` is required')
        .bail()
        .isBoolean().withMessage('Field `can_write` must be a boolean')
        .toBoolean(),
    body('permissions.*.can_update')
        .exists().withMessage('Field `can_update` is required')
        .bail()
        .isBoolean().withMessage('Field `can_update` must be a boolean')
        .toBoolean(),
    body('permissions.*.can_read')
        .exists().withMessage('Field `can_read` is required')
        .bail()
        .isBoolean().withMessage('Field `can_read` must be a boolean')
        .toBoolean(),
    body('permissions.*.can_delete')
        .exists().withMessage('Field `can_delete` is required')
        .bail()
        .isBoolean().withMessage('Field `can_delete` must be a boolean')
        .toBoolean(),
];

export const UpdateRoleValidator = [
    //* Required
    param('id')
        .exists().withMessage('Param `id` is required')
        .bail()
        .notEmpty().withMessage('Param `id` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `id` must be a positive integer')
        .toInt(),

    //* Optional
    body('name')
        .isString().withMessage('Field `name` must be a string')
        .bail()
        .notEmpty().withMessage('Field `name` cannot be empty'),
    body('description')
        .isString().withMessage('Field `description` must be a string'),
    body('permissions')
        .isArray({ min: 1 }).withMessage('Field `permissions` must be a non-empty array'),
    body('permissions.*.module_id')
        .isInt().withMessage('Field `module_id` must be an integer')
        .toInt(),
    body('permissions.*.module_name')
        .isString().withMessage('Field `module_name` must be a string')
        .bail()
        .notEmpty().withMessage('Field `module_name` cannot be empty'),
    body('permissions.*.can_write')
        .isBoolean().withMessage('Field `can_write` must be a boolean')
        .toBoolean(),
    body('permissions.*.can_update')
        .isBoolean().withMessage('Field `can_update` must be a boolean')
        .toBoolean(),
    body('permissions.*.can_read')
        .isBoolean().withMessage('Field `can_read` must be a boolean')
        .toBoolean(),
    body('permissions.*.can_delete')
        .isBoolean().withMessage('Field `can_delete` must be a boolean')
        .toBoolean(),
];

export const DeleteRoleValidor = [
    //* Required
    param('id')
        .exists().withMessage('Param `id` is required')
        .bail()
        .notEmpty().withMessage('Param `id` cannot be empty')
        .bail()
        .isInt({ min: 1 }).withMessage('Param `id` must be a positive integer')
        .toInt()
];
