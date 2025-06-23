import { Router } from 'express';
import { container } from '../../ioc/config';
import { RoleController } from '../controllers/role.ctrl';
import { GetPermissionsByRoleValidator, GetRolesValidator } from '../validators/role.validator';

const router = Router();
const controller = container.get<RoleController>(RoleController);

router
    .get('/', GetRolesValidator, controller.getRoles)
    .get('/:id', GetPermissionsByRoleValidator, controller.getPermissionsByRole)
    .post('/', controller.createRole)
    .patch('/:id', controller.updateRole)
    .delete('/:id', controller.deleteRole)
    ;

export default router;
