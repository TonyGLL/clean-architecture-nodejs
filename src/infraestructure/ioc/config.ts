import 'reflect-metadata';
import { Container } from 'inversify';
import { Pool } from 'pg';
import { DOMAIN_TYPES } from '../../domain/ioc.types';
import { APPLICATION_TYPES } from '../../application/ioc.types';
import { INFRASTRUCTURE_TYPES } from './types';
import pool from '../database/postgres/config';

// Repos
import { IAuthRepository } from '../../domain/repositories/auth.repository';
import { IRoleRepository } from "../../domain/repositories/role.repository";
import { IUserRoleRepository } from "../../domain/repositories/userRole.repository";
import { PostgresAuthRepository } from '../database/postgres/repositories/auth.repository';
import { PostgresUserRepository } from '../database/postgres/repositories/user.repository';
import { PostgresRoleRepository } from "../database/postgres/repositories/role.repository";
import { PostgresUserRoleRepository } from "../database/postgres/repositories/userRole.repository";
import { IUserRepository } from '../../domain/repositories/user.repository';
import { PostgresModulesRepository } from '../database/postgres/repositories/modules.repository';
import { IModulesRepository } from '../../domain/repositories/modules.repository';
import { IProductsRepository } from '../../domain/repositories/products.repository';
import { PostgresProductsRepository } from '../database/postgres/repositories/products.repository';
import { ICartRepository } from '../../domain/repositories/cart.repository';
import { PostgresCartRepository } from '../database/postgres/repositories/cart.repository';
import { IStripePaymentRepository } from '../../domain/repositories/stripe.payment.repository';
import { PostgresStripePaymentRepository } from '../database/postgres/repositories/stripe.payment.repository';
import { IOrderRepository } from '../../domain/repositories/order.repository';
import { PostgresOrderRepository } from '../database/postgres/repositories/order.repository';
import { IAddressRepository } from '../../domain/repositories/address.repository';
import { PostgresAddressRepository } from '../database/postgres/repositories/address.repository';
import { IWishlistRepository } from '../../domain/repositories/wishlist.repository';
import { PostgresWishlistRepository } from '../database/postgres/repositories/wishlist.repository';

// Services
import { IHashingService } from './../../domain/services/hashing.service';
import { IJwtService } from '../../application/services/jwt.service';
import { JwtService } from '../driven/services/jwt.service';
import { IMailService } from '../../domain/services/mail.service';
import { NodeMailerService } from '../driven/services/node-mailer.service';
import { BcryptService } from '../driven/services/bcrypt.service';
import { IStripeService } from '../../domain/services/stripe.service';
import { StripePaymentService } from '../driven/services/stripe.payment.service';

// Use Cases
import { LoginUseCase, RegisterClientUseCase, SendEmailUseCase, RestorePasswordUseCase } from '../../application/use-cases/auth.use-case';
import { CreateRoleUseCase, GetRolesUseCase, GetPermissionsByRoleUseCase, DeleteRoleUseCase, UpdateRoleUseCase } from "../../application/use-cases/role.use-case";
import { CreateUserUseCase, GetUsersUseCase, UpdateUserUseCase, DeleteUserUseCase, ChangePasswordUseCase, AssignRoleToUserUseCase, GetUserDetailsUseCase } from '../../application/use-cases/user.use-case';
import { GetAllModulesUseCase, GetModuleByIdUseCase, CreateModuleUseCase, UpdateModuleUseCase, DeleteModuleUseCase } from '../../application/use-cases/modules.use-case';
import { GetProductsByCategoryUseCase, SearchProductsUseCase, UpsertProductsWithCategoriesUseCase, GetProductDetailsUseCase } from '../../application/use-cases/products.use-case';
import { AddProductToCartUseCase, ClearCartUseCase, DeleteProductFromCartUseCase, GetCartUseCase, LinkAddressToCartUseCase } from '../../application/use-cases/cart.use-case';
import { AddPaymentMethodUseCase, CreatePaymentIntentUseCase, CreateSetupIntentUseCase, DeletePaymentMethodUseCase, GetClientPaymentMethodsUseCase } from '../../application/use-cases/stripe.use-case';
import { CreateOrderUseCase, GetClientOrdersUseCase, GetOrderByIdUseCase, UpdateOrderStatusUseCase } from '../../application/use-cases/order.use-case';
import { CreateAddressUseCase, DeleteAddressUseCase, GetAddressByClientIdUseCase, GetAddressByIdUseCase, SetDefaultAddressUseCase, UpdateAddressUseCase } from '../../application/use-cases/address.use-case';
import { CreateWishlistUseCase, GetClientWishlistDetailsUseCase, GetClientWishlistsUseCase } from '../../application/use-cases/wishlist.use-case';

// Controllers
import { AuthClientsController } from '../http/controllers/auth.clients.ctrl';
import { RoleController } from "../http/controllers/role.ctrl";
import { UserController } from '../http/controllers/user.ctrl';
import { ModulesController } from '../http/controllers/modules.ctrl';
import { AuthAdminController } from '../http/controllers/auth.admin.ctrl';
import { ProductsController } from '../http/controllers/products.ctrl';
import { CartController } from '../http/controllers/cart.ctrl';
import { StripeWebhookController } from '../http/controllers/stripe.webhook.ctrl';
import { StripeController } from '../http/controllers/stripe.ctrl';
import { AddressController } from '../http/controllers/address.ctrl';
import { WishlistController } from '../http/controllers/wishlist.ctrl';

const container = new Container();

// DB
container.bind<Pool>(INFRASTRUCTURE_TYPES.PostgresPool).toConstantValue(pool);

// Respositories (Inteface -> Implementation)
container.bind<IAuthRepository>(DOMAIN_TYPES.IAuthRepository).to(PostgresAuthRepository);
container.bind<IRoleRepository>(DOMAIN_TYPES.IRoleRepository).to(PostgresRoleRepository);
container.bind<IUserRoleRepository>(DOMAIN_TYPES.IUserRoleRepository).to(PostgresUserRoleRepository);
container.bind<IUserRepository>(DOMAIN_TYPES.IUserRepository).to(PostgresUserRepository);
container.bind<IModulesRepository>(DOMAIN_TYPES.IModulesRepository).to(PostgresModulesRepository);
container.bind<IProductsRepository>(DOMAIN_TYPES.IProductsRepository).to(PostgresProductsRepository);
container.bind<ICartRepository>(DOMAIN_TYPES.ICartRepository).to(PostgresCartRepository);
container.bind<IStripePaymentRepository>(DOMAIN_TYPES.IStripePaymentRepository).to(PostgresStripePaymentRepository);
container.bind<IOrderRepository>(DOMAIN_TYPES.IOrderRepository).to(PostgresOrderRepository);
container.bind<IAddressRepository>(DOMAIN_TYPES.IAddressRepository).to(PostgresAddressRepository);
container.bind<IWishlistRepository>(DOMAIN_TYPES.IWishlistRepository).to(PostgresWishlistRepository);

// Services (Interface -> Implementation)
container.bind<IHashingService>(DOMAIN_TYPES.IHashingService).to(BcryptService);
container.bind<IJwtService>(APPLICATION_TYPES.IJwtService).to(JwtService);
container.bind<IMailService>(DOMAIN_TYPES.IMailService).to(NodeMailerService);
container.bind<IStripeService>(DOMAIN_TYPES.IStripeService).to(StripePaymentService);

// Use Cases (Concrete classes)
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
// Cart
container.bind<GetCartUseCase>(GetCartUseCase).toSelf();
container.bind<AddProductToCartUseCase>(AddProductToCartUseCase).toSelf();
container.bind<DeleteProductFromCartUseCase>(DeleteProductFromCartUseCase).toSelf();
container.bind<ClearCartUseCase>(ClearCartUseCase).toSelf();
container.bind<LinkAddressToCartUseCase>(LinkAddressToCartUseCase).toSelf();
// Payment
container.bind<GetClientPaymentMethodsUseCase>(GetClientPaymentMethodsUseCase).toSelf();
container.bind<DeletePaymentMethodUseCase>(DeletePaymentMethodUseCase).toSelf();
container.bind<CreatePaymentIntentUseCase>(CreatePaymentIntentUseCase).toSelf();
container.bind<CreateSetupIntentUseCase>(CreateSetupIntentUseCase).toSelf();
container.bind<AddPaymentMethodUseCase>(AddPaymentMethodUseCase).toSelf();
// Order
container.bind<CreateOrderUseCase>(CreateOrderUseCase).toSelf();
container.bind<GetOrderByIdUseCase>(GetOrderByIdUseCase).toSelf();
container.bind<GetClientOrdersUseCase>(GetClientOrdersUseCase).toSelf();
container.bind<UpdateOrderStatusUseCase>(UpdateOrderStatusUseCase).toSelf();
// Address
container.bind<CreateAddressUseCase>(CreateAddressUseCase).toSelf();
container.bind<GetAddressByClientIdUseCase>(GetAddressByClientIdUseCase).toSelf();
container.bind<GetAddressByIdUseCase>(GetAddressByIdUseCase).toSelf();
container.bind<UpdateAddressUseCase>(UpdateAddressUseCase).toSelf();
container.bind<DeleteAddressUseCase>(DeleteAddressUseCase).toSelf();
container.bind<SetDefaultAddressUseCase>(SetDefaultAddressUseCase).toSelf();
// Wishlist
container.bind<GetClientWishlistsUseCase>(GetClientWishlistsUseCase).toSelf();
container.bind<GetClientWishlistDetailsUseCase>(GetClientWishlistDetailsUseCase).toSelf();
container.bind<CreateWishlistUseCase>(CreateWishlistUseCase).toSelf();

// Controllers (Concrete classes)
container.bind<AuthClientsController>(AuthClientsController).toSelf();
container.bind<AuthAdminController>(AuthAdminController).toSelf();
container.bind<RoleController>(RoleController).toSelf();
container.bind<UserController>(UserController).toSelf();
container.bind<ModulesController>(ModulesController).toSelf();
container.bind<ProductsController>(ProductsController).toSelf();
container.bind<CartController>(CartController).toSelf();
container.bind<StripeController>(StripeController).toSelf();
container.bind<StripeWebhookController>(StripeWebhookController).toSelf();
container.bind<AddressController>(AddressController).toSelf();
container.bind<WishlistController>(WishlistController).toSelf();

export { container };