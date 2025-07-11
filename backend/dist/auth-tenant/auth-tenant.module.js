"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthTenantModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_tenant_controller_1 = require("./auth-tenant.controller");
const auth_tenant_service_1 = require("./auth-tenant.service");
const jwt_tenant_user_strategy_1 = require("./strategies/jwt-tenant-user.strategy");
let AuthTenantModule = class AuthTenantModule {
};
exports.AuthTenantModule = AuthTenantModule;
exports.AuthTenantModule = AuthTenantModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN'),
                    },
                }),
            }),
        ],
        controllers: [auth_tenant_controller_1.AuthTenantController],
        providers: [
            auth_tenant_service_1.AuthTenantService,
            jwt_tenant_user_strategy_1.JwtTenantUserStrategy,
        ],
        exports: [auth_tenant_service_1.AuthTenantService],
    })
], AuthTenantModule);
//# sourceMappingURL=auth-tenant.module.js.map