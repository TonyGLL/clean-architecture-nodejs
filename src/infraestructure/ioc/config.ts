import 'reflect-metadata';
import { Container } from 'inversify';
import { Pool } from 'pg';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { APPLICATION_TYPES } from '../../application/ioc.types';
import { INFRASTRUCTURE_TYPES } from './types';
import pool from '../database/postgres/config';

//* Repos
import { IAuthClientRepository } from '../../domain/repositories/auth.client.repository';
import { IRoleRepository } from "../../domain/repositories/role.repository";
import { IUserRoleRepository } from "../../domain/repositories/userRole.repository";
import { PostgresAuthClientRepository } from '../database/postgres/repositories/auth.client.repository';

//* Services
import { IHashingService } from './../../domain/services/hashing.service';
import { IJwtService } from '../../application/services/jwt.service';
import { JwtService } from '../driven/services/jwt.service';
import { IMailService } from '../../domain/services/mail.service';
import { NodeMailerService } from '../driven/services/node-mailer.service';
import { PostegresRoleRepository } from "../database/postgres/repositories/role.repository";
import { PostgresUserRoleRepository } from "../database/postgres/repositories/userRole.repository";

//* Use Cases
import { LoginClientUseCase, RegisterClientUseCase, SendEmailClientUseCase, RestorePasswordClientUseCase } from '../../application/use-cases/auth.client.use-case';
import { CreateRoleUseCase, GetRolesUseCase, GetPermissionsByRoleUseCase, DeleteRoleUseCase, UpdateRoleUseCase } from "../../application/use-cases/role.use-case";

//* Controllers
import { AuthController } from './../http/controllers/auth.ctrl';
import { RoleController } from "../http/controllers/role.ctrl";
import { BcryptService } from '../driven/services/bcrypt.service';

const container = new Container();

//* DB
container.bind<Pool>(INFRASTRUCTURE_TYPES.PostgresPool).toConstantValue(pool);

//* Respositories (Inteface -> Implementation)
container.bind<IAuthClientRepository>(DOMAIN_TYPES.IAuthClientRepository).to(PostgresAuthClientRepository);
container.bind<IRoleRepository>(DOMAIN_TYPES.IRoleRepository).to(PostegresRoleRepository);
container.bind<IUserRoleRepository>(DOMAIN_TYPES.IUserRoleRepository).to(PostgresUserRoleRepository);

//* Services (Interface -> Implementation)
// Assuming BcryptService is the concrete implementation for IHashingService
container.bind<IHashingService>(DOMAIN_TYPES.IHashingService).to(BcryptService);
container.bind<IJwtService>(APPLICATION_TYPES.IJwtService).to(JwtService);
container.bind<IMailService>(DOMAIN_TYPES.IMailService).to(NodeMailerService);

//* Use Cases (Concrete classes)
// AUTH
container.bind<LoginClientUseCase>(LoginClientUseCase).toSelf();
container.bind<RegisterClientUseCase>(RegisterClientUseCase).toSelf();
container.bind<SendEmailClientUseCase>(SendEmailClientUseCase).toSelf();
container.bind<RestorePasswordClientUseCase>(RestorePasswordClientUseCase).toSelf();
// ROLES
container.bind<GetRolesUseCase>(GetRolesUseCase).toSelf();
container.bind<GetPermissionsByRoleUseCase>(GetPermissionsByRoleUseCase).toSelf();
container.bind<CreateRoleUseCase>(CreateRoleUseCase).toSelf();
container.bind<UpdateRoleUseCase>(UpdateRoleUseCase).toSelf();
container.bind<DeleteRoleUseCase>(DeleteRoleUseCase).toSelf();

//* Controllers (Concrete classes)
container.bind<AuthController>(AuthController).toSelf();
container.bind<RoleController>(RoleController).toSelf();

export { container };