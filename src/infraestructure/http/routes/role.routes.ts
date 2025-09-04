import { Router } from 'express';
import { container } from '../../ioc/config';
import { RoleController } from '../controllers/role.ctrl';
import { CreateRoleValidator, DeleteRoleValidator, GetPermissionsByRoleValidator, GetRolesValidator, UpdateRoleValidator } from '../validators/role.validator';
import { expressValidatorErrors } from '../middlewares/validator.middleware';

const router = Router();
const controller = container.get<RoleController>(RoleController);

router
    .get('/', GetRolesValidator, expressValidatorErrors, controller.getRoles)
    .get('/:id', GetPermissionsByRoleValidator, expressValidatorErrors, controller.getPermissionsByRole)
    .post('/', CreateRoleValidator, expressValidatorErrors, controller.createRole)
    .put('/:id', UpdateRoleValidator, expressValidatorErrors, controller.updateRole)
    .delete('/:id', DeleteRoleValidator, expressValidatorErrors, controller.deleteRole)
    ;

export default router;
