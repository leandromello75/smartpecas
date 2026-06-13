import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtTenantUserPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtTenantUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
