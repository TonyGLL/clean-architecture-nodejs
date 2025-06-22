import 'reflect-metadata';
import { Container } from 'inversify';
import { Pool } from 'pg';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { APPLICATION_TYPES } from '../../application/ioc.types';
import { INFRASTRUCTURE_TYPES } from './types';
import pool from '../database/postgres/config';

//* Repos
import { IUserRepository } from './../../domain/repositories/user.repository';
import { IRoleRepository } from "../../domain/repositories/role.repository";
import { IUserRoleRepository } from "../../domain/repositories/userRole.repository";
import { PostgresUserRepository } from '../database/postgres/repositories/user.repository';

//* Services
import { IHashingService } from './../../domain/services/hashing.service';
import { IJwtService } from '../../application/services/jwt.service';
import { JwtService } from '../driven/services/jwt.service';
import { IMailService } from '../../domain/services/mail.service';
import { NodeMailerService } from '../driven/services/node-mailer.service';
import { PostegresRoleRepository } from "../database/postgres/repositories/role.repository";
import { PostgresUserRoleRepository } from "../database/postgres/repositories/userRole.repository";

//* Use Cases
import { LoginUseCase, RegisterUseCase, SendEmailUseCase, RestorePasswordUseCase } from '../../application/use-cases/auth.use-case';
import { CreateRoleUseCase, GetRolesUseCase } from "../../application/use-cases/role.use-case";

//* Controllers
import { AuthController } from './../http/controllers/auth.ctrl';
import { RoleController } from "../http/controllers/role.ctrl";
import { BcryptService } from '../driven/services/bcrypt.service';

const container = new Container();

//* DB
container.bind<Pool>(INFRASTRUCTURE_TYPES.PostgresPool).toConstantValue(pool);

//* Respositories (Inteface -> Implementation)
container.bind<IUserRepository>(DOMAIN_TYPES.IUserRepository).to(PostgresUserRepository);
container.bind<IRoleRepository>(DOMAIN_TYPES.IRoleRepository).to(PostegresRoleRepository);
container.bind<IUserRoleRepository>(DOMAIN_TYPES.IUserRoleRepository).to(PostgresUserRoleRepository);

//* Services (Interface -> Implementation)
// Assuming BcryptService is the concrete implementation for IHashingService
container.bind<IHashingService>(DOMAIN_TYPES.IHashingService).to(BcryptService);
container.bind<IJwtService>(APPLICATION_TYPES.IJwtService).to(JwtService);
container.bind<IMailService>(DOMAIN_TYPES.IMailService).to(NodeMailerService);

//* Use Cases (Concrete classes)
container.bind<LoginUseCase>(LoginUseCase).toSelf();
container.bind<RegisterUseCase>(RegisterUseCase).toSelf();
container.bind<SendEmailUseCase>(SendEmailUseCase).toSelf();
container.bind<RestorePasswordUseCase>(RestorePasswordUseCase).toSelf();

// ROLES
container.bind<GetRolesUseCase>(APPLICATION_TYPES.GetRolesUseCase).to(GetRolesUseCase);
container.bind<CreateRoleUseCase>(APPLICATION_TYPES.CreateRoleUseCase).to(CreateRoleUseCase);

//* Controllers (Concrete classes)
container.bind<AuthController>(AuthController).toSelf();
container.bind<RoleController>(RoleController).toSelf();

export { container };