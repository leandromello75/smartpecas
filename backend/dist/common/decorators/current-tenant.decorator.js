"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTenant = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentTenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext = request.tenantContext;
    if (!tenantContext) {
        throw new common_1.InternalServerErrorException('TenantContext não definido na requisição.');
    }
    return data ? tenantContext[data] : tenantContext;
});
//# sourceMappingURL=current-tenant.decorator.js.map