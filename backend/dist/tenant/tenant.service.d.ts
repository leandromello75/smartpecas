import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant } from '@prisma/client';
export declare class TenantService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createTenantDto: CreateTenantDto): Promise<Tenant>;
    findOne(id: string): Promise<Tenant | null>;
    findAll(): Promise<Tenant[]>;
    private generateSlug;
    private generateUniqueSuffix;
}
