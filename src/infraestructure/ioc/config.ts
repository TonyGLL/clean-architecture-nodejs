import 'reflect-metadata';
import { Container } from 'inversify';
import { Pool } from 'pg';
import { TYPES } from './types';
import pool from '../database/postgres/config';

//* Repos
import { IUserRepository } from './../../domain/repositories/user.repository';
import { PostgresUserRepository } from '../database/postgres/postgres.user.repository';

//* Services
import { IHashingService } from './../../domain/services/hashing.service';
import { IJwtService } from '../../application/services/jwt.service';
import { JwtService } from '../driven/services/jwt.service';

//* Use Cases
import { AuthUseCase } from '../../application/use-cases/auth.use-case';

//* Controllers
import { AuthController } from './../http/controllers/auth.ctrl';
import { BcryptService } from '../driven/services/bcrypt.service';

const container = new Container();

//* DB
container.bind<Pool>(TYPES.PostgresPool).toConstantValue(pool);

//* Respositories (Inteface -> Implementation)
container.bind<IUserRepository>(TYPES.IUserRepository).to(PostgresUserRepository);

//* Services (Interface -> Implementation)
container.bind<IHashingService>(TYPES.IHashingService).to(BcryptService);
container.bind<IJwtService>(TYPES.IJwtService).to(JwtService);

//* Use Cases (Concrete classes)
container.bind<AuthUseCase>(AuthUseCase).toSelf();

//* Controllers (Concrete classes)
container.bind<AuthController>(AuthController).toSelf();

export { container };