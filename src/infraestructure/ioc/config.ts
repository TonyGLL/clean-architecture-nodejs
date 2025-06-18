import 'reflect-metadata';
import { Container } from 'inversify';
import { Pool } from 'pg';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { APPLICATION_TYPES } from '../../application/ioc.types';
import { INFRASTRUCTURE_TYPES } from './types';
import pool from '../database/postgres/config';

//* Repos
import { IUserRepository } from './../../domain/repositories/user.repository';
import { PostgresUserRepository } from '../database/postgres/postgres.user.repository';

//* Services
import { IHashingService } from './../../domain/services/hashing.service';
import { IJwtService } from '../../application/services/jwt.service';
import { JwtService } from '../driven/services/jwt.service';
import { IMailService } from '../../domain/services/mail.service';
import { NodeMailerService } from '../driven/services/node-mailer.service';

//* Use Cases
import { LoginUseCase, RegisterUseCase, SendEmailUseCase, RestorePasswordUseCase } from '../../application/use-cases/auth.use-case';

//* Controllers
import { AuthController } from './../http/controllers/auth.ctrl';
import { BcryptService } from '../driven/services/bcrypt.service';

const container = new Container();

//* DB
container.bind<Pool>(INFRASTRUCTURE_TYPES.PostgresPool).toConstantValue(pool);

//* Respositories (Inteface -> Implementation)
container.bind<IUserRepository>(DOMAIN_TYPES.IUserRepository).to(PostgresUserRepository);

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

//* Controllers (Concrete classes)
container.bind<AuthController>(AuthController).toSelf();

export { container };