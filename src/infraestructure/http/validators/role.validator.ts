import { body, query } from "express-validator";
import { idParamValidator, pageLimitQueryValidator } from "./general.validator";

export const GetRolesValidator = [
    //* Required
    ...pageLimitQueryValidator,

    //* Optional
    query('search')
        .optional()
        .trim().escape()
];

export const GetPermissionsByRoleValidator = [
    //* Required
    ...idParamValidator
];

export const CreateRoleValidator = [
    //* Required
    body('name')
        .exists().withMessage('Field `name` is required')
        .bail()
        .isString().withMessage('Field `name` must be a string')
        .bail()
        .notEmpty().withMessage('Field `name` cannot be empty')
        .trim().escape(),
    body('description')
        .exists().withMessage('Field `description` is required')
        .bail()
        .isString().withMessage('Field `description` must be a string')
        .trim().escape(),
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
        .notEmpty().withMessage('Field `module_name` cannot be empty')
        .trim().escape(),
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
        .toBoolean()
];

export const UpdateRoleValidator = [
    //* Required
    ...idParamValidator,
    body('name')
        .exists().withMessage('Field `name` is required')
        .bail()
        .isString().withMessage('Field `name` must be a string')
        .bail()
        .notEmpty().withMessage('Field `name` cannot be empty')
        .trim().escape(),
    body('description')
        .exists().withMessage('Field `description` is required')
        .bail()
        .isString().withMessage('Field `description` must be a string')
        .trim().escape(),
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
        .notEmpty().withMessage('Field `module_name` cannot be empty')
        .trim().escape(),
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
        .toBoolean()
];

export const DeleteRoleValidator = [
    //* Required
    ...idParamValidator
];
