import { Router } from 'express';
import { container } from '../../ioc/config';
import { RoleController } from '../controllers/role.ctrl';
import { CreateRoleValidator, DeleteRoleValidor, GetPermissionsByRoleValidator, GetRolesValidator, UpdateRoleValidator } from '../validators/role.validator';

const router = Router();
const controller = container.get<RoleController>(RoleController);

router
    .get('/', GetRolesValidator, controller.getRoles)
    .get('/:id', GetPermissionsByRoleValidator, controller.getPermissionsByRole)
    .post('/', CreateRoleValidator, controller.createRole)
    .patch('/:id', UpdateRoleValidator, controller.updateRole)
    .delete('/:id', DeleteRoleValidor, controller.deleteRole)
    ;

export default router;
