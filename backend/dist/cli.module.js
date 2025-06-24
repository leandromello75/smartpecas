"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliModule = void 0;
const common_1 = require("@nestjs/common");
const check_tenants_command_1 = require("./cli/commands/check-tenants.command");
const prisma_service_1 = require("./prisma/prisma.service");
const tenant_service_1 = require("./tenant/tenant.service");
let CliModule = class CliModule {
};
exports.CliModule = CliModule;
exports.CliModule = CliModule = __decorate([
    (0, common_1.Module)({
        providers: [
            check_tenants_command_1.CheckTenantsCommand,
            prisma_service_1.PrismaService,
            tenant_service_1.TenantService,
        ],
    })
], CliModule);
//# sourceMappingURL=cli.module.js.map