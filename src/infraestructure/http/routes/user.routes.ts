import { Router } from 'express';
import { container } from '../../ioc/config';
import { UserController } from '../controllers/user.ctrl';
import { GetUsersValidator, CreateUserValidator, UpdateUserValidator, UserIdValidator, ChangePasswordValidator, AssignRoleValidator } from '../validators/user.validator';

const router = Router();
const controller = container.get<UserController>(UserController);

router
    .get('/', GetUsersValidator, controller.getUsers)
    .get('/:id', UserIdValidator, controller.getUserDetails)
    .post('/', CreateUserValidator, controller.createUser)
    .patch('/:id', UpdateUserValidator, controller.updateUser)
    .delete('/:id', UserIdValidator, controller.deleteUser)
    .patch('/:id/password', ChangePasswordValidator, controller.changePassword)
    .post('/:id/roles', AssignRoleValidator, controller.assignRole);

export default router;
