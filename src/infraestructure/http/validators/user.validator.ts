import { body, param, query } from 'express-validator';
import { pageLimitQueryValidator } from './general.validator';

export const GetUsersValidator = [
    ...pageLimitQueryValidator,
    query('search').optional().isString().withMessage('Search must be a string')
];

export const CreateUserValidator = [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('lastName').isString().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Must be a valid email'),
    body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('birthDate').optional().isISO8601().toDate().withMessage('Must be a valid date'),
    body('phone').optional().isString().withMessage('Phone must be a string')
];

export const UpdateUserValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
    body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string'),
    body('lastName').optional().isString().notEmpty().withMessage('Last name must be a non-empty string'),
    body('birthDate').optional().isISO8601().toDate().withMessage('Must be a valid date'),
    body('phone').optional().isString().withMessage('Phone must be a string')
];

export const UserIdValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')
];

export const ChangePasswordValidator = [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
    body('newPassword').isString().isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
];

export const AssignRoleValidator = [
    param('id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('roleId').isInt({ min: 1 }).withMessage('Role ID must be a positive integer')
];
