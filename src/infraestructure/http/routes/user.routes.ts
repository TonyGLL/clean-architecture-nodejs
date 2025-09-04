import { Router } from 'express';
import { container } from '../../ioc/config';
import { UserController } from '../controllers/user.ctrl';
import { GetUsersValidator, CreateUserValidator, UpdateUserValidator, UserIdValidator, ChangePasswordValidator, AssignRoleValidator } from '../validators/user.validator';
import { expressValidatorErrors } from '../middlewares/validator.middleware';

const router = Router();
const controller = container.get<UserController>(UserController);

router
    .get('/', GetUsersValidator, expressValidatorErrors, controller.getUsers)
    .get('/:id', UserIdValidator, expressValidatorErrors, controller.getUserDetails)
    .post('/', CreateUserValidator, expressValidatorErrors, controller.createUser)
    .patch('/:id', UpdateUserValidator, expressValidatorErrors, controller.updateUser)
    .delete('/:id', UserIdValidator, expressValidatorErrors, controller.deleteUser)
    .patch('/:id/password', ChangePasswordValidator, expressValidatorErrors, controller.changePassword)
    .post('/:id/roles', AssignRoleValidator, expressValidatorErrors, controller.assignRole);

export default router;
