import { TenantContext } from '../tenant-context/tenant-context.service';
export declare const CurrentTenant: (...dataOrPipes: (keyof TenantContext | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
