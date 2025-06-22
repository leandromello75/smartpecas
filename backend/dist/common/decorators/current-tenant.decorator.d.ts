import { TenantContext } from '../tenant-context/tenant-context.service';
export declare const CurrentTenant: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | keyof TenantContext | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
