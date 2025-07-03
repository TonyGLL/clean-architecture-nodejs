import 'reflect-metadata';
import { Container } from 'inversify';
import { Pool } from 'pg';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { APPLICATION_TYPES } from '../../application/ioc.types';
import { INFRASTRUCTURE_TYPES } from './types';
import pool from '../database/postgres/config';

//* Repos
import { IAuthRepository } from '../../domain/repositories/auth.repository';
import { IRoleRepository } from "../../domain/repositories/role.repository";
import { IUserRoleRepository } from "../../domain/repositories/userRole.repository";
import { PostgresAuthRepository } from '../database/postgres/repositories/auth.repository';
import { PostgresUserRepository } from '../database/postgres/repositories/user.repository';
import { PostegresRoleRepository } from "../database/postgres/repositories/role.repository";
import { PostgresUserRoleRepository } from "../database/postgres/repositories/userRole.repository";
import { IUserRepository } from '../../domain/repositories/user.repository';
import { PostegresModulesRepository } from '../database/postgres/repositories/modules.repository';
import { IModulesRepository } from '../../domain/repositories/modules.repository';
import { IProductsRepository } from '../../domain/repositories/products.repository';
import { PostegresProductsRepository } from '../database/postgres/repositories/products.repository';

//* Services
import { IHashingService } from './../../domain/services/hashing.service';
import { IJwtService } from '../../application/services/jwt.service';
import { JwtService } from '../driven/services/jwt.service';
import { IMailService } from '../../domain/services/mail.service';
import { NodeMailerService } from '../driven/services/node-mailer.service';
import { BcryptService } from '../driven/services/bcrypt.service';

//* Use Cases
import { LoginUseCase, RegisterClientUseCase, SendEmailUseCase, RestorePasswordUseCase } from '../../application/use-cases/auth.use-case';
import { CreateRoleUseCase, GetRolesUseCase, GetPermissionsByRoleUseCase, DeleteRoleUseCase, UpdateRoleUseCase } from "../../application/use-cases/role.use-case";
import { CreateUserUseCase, GetUsersUseCase, UpdateUserUseCase, DeleteUserUseCase, ChangePasswordUseCase, AssignRoleToUserUseCase, GetUserDetailsUseCase } from '../../application/use-cases/user.use-case';
import { GetAllModulesUseCase, GetModuleByIdUseCase, CreateModuleUseCase, UpdateModuleUseCase, DeleteModuleUseCase } from '../../application/use-cases/modules.use-case';
import { GetProductsByCategoryUseCase, SearchProductsUseCase, UpsertProductsWithCategoriesUseCase, GetProductDetailsUseCase } from '../../application/use-cases/products.use-case';

//* Controllers
import { AuthClientsController } from '../http/controllers/auth.clients.ctrl';
import { RoleController } from "../http/controllers/role.ctrl";
import { UserController } from '../http/controllers/user.ctrl';
import { ModulesController } from '../http/controllers/modules.ctrl';
import { AuthAdminController } from '../http/controllers/auth.admin.ctrl';
import { ProductsController } from '../http/controllers/products.ctrl';

const container = new Container();

//* DB
container.bind<Pool>(INFRASTRUCTURE_TYPES.PostgresPool).toConstantValue(pool);

//* Respositories (Inteface -> Implementation)
container.bind<IAuthRepository>(DOMAIN_TYPES.IAuthRepository).to(PostgresAuthRepository);
container.bind<IRoleRepository>(DOMAIN_TYPES.IRoleRepository).to(PostegresRoleRepository);
container.bind<IUserRoleRepository>(DOMAIN_TYPES.IUserRoleRepository).to(PostgresUserRoleRepository);
container.bind<IUserRepository>(DOMAIN_TYPES.IUserRepository).to(PostgresUserRepository);
container.bind<IModulesRepository>(DOMAIN_TYPES.IModulesRepository).to(PostegresModulesRepository);
container.bind<IProductsRepository>(DOMAIN_TYPES.IProductsRepository).to(PostegresProductsRepository);

//* Services (Interface -> Implementation)
// Assuming BcryptService is the concrete implementation for IHashingService
container.bind<IHashingService>(DOMAIN_TYPES.IHashingService).to(BcryptService);
container.bind<IJwtService>(APPLICATION_TYPES.IJwtService).to(JwtService);
container.bind<IMailService>(DOMAIN_TYPES.IMailService).to(NodeMailerService);

//* Use Cases (Concrete classes)
// AUTH
container.bind<LoginUseCase>(LoginUseCase).toSelf();
container.bind<RegisterClientUseCase>(RegisterClientUseCase).toSelf();
container.bind<SendEmailUseCase>(SendEmailUseCase).toSelf();
container.bind<RestorePasswordUseCase>(RestorePasswordUseCase).toSelf();
// ROLES
container.bind<GetRolesUseCase>(GetRolesUseCase).toSelf();
container.bind<GetPermissionsByRoleUseCase>(GetPermissionsByRoleUseCase).toSelf();
container.bind<CreateRoleUseCase>(CreateRoleUseCase).toSelf();
container.bind<UpdateRoleUseCase>(UpdateRoleUseCase).toSelf();
container.bind<DeleteRoleUseCase>(DeleteRoleUseCase).toSelf();
// USERS
container.bind<GetUsersUseCase>(GetUsersUseCase).toSelf();
container.bind<CreateUserUseCase>(CreateUserUseCase).toSelf();
container.bind<UpdateUserUseCase>(UpdateUserUseCase).toSelf();
container.bind<DeleteUserUseCase>(DeleteUserUseCase).toSelf();
container.bind<ChangePasswordUseCase>(ChangePasswordUseCase).toSelf();
container.bind<AssignRoleToUserUseCase>(AssignRoleToUserUseCase).toSelf();
container.bind<GetUserDetailsUseCase>(GetUserDetailsUseCase).toSelf();
// Modules
container.bind<GetAllModulesUseCase>(GetAllModulesUseCase).toSelf();
container.bind<GetModuleByIdUseCase>(GetModuleByIdUseCase).toSelf();
container.bind<CreateModuleUseCase>(CreateModuleUseCase).toSelf();
container.bind<UpdateModuleUseCase>(UpdateModuleUseCase).toSelf();
container.bind<DeleteModuleUseCase>(DeleteModuleUseCase).toSelf();
// Products
container.bind<UpsertProductsWithCategoriesUseCase>(UpsertProductsWithCategoriesUseCase).toSelf();
container.bind<SearchProductsUseCase>(SearchProductsUseCase).toSelf();
container.bind<GetProductsByCategoryUseCase>(GetProductsByCategoryUseCase).toSelf();
container.bind<GetProductDetailsUseCase>(GetProductDetailsUseCase).toSelf();

//* Controllers (Concrete classes)
container.bind<AuthClientsController>(AuthClientsController).toSelf();
container.bind<AuthAdminController>(AuthAdminController).toSelf();
container.bind<RoleController>(RoleController).toSelf();
container.bind<UserController>(UserController).toSelf();
container.bind<ModulesController>(ModulesController).toSelf();
container.bind<ProductsController>(ProductsController).toSelf();

export { container };