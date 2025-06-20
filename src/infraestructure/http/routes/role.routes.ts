import { Router } from 'express';
import { container } from '../../ioc/config';
import { RoleController } from '../controllers/role.ctrl';
import { authMiddleware } from '../middlewares/auth.middleware';
// import { expressValidatorErrors } from '../middlewares/validator.middleware'; // Placeholder for validators
// import { createRoleValidator, assignRoleValidator } from '../validators/role.validator'; // Placeholder

const router = Router();
const controller = container.get<RoleController>(RoleController);
router.use(authMiddleware);

// For now, routes are unprotected. Middleware will be added in a later step.
// router.post('/roles', createRoleValidator, expressValidatorErrors, controller.createRole.bind(controller));
router.post('/roles', controller.createRole.bind(controller));

// router.post('/users/:userId/roles', assignRoleValidator, expressValidatorErrors, controller.assignRoleToUser.bind(controller));
router.post('/users/:userId/roles', controller.assignRoleToUser.bind(controller));

router.get('/users/:userId/roles', controller.getRolesForUser.bind(controller));

router.delete('/users/:userId/roles/:roleName', controller.revokeRoleFromUser.bind(controller));

export default router;
