import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Prisma } from '@prisma/client';
export declare class TenantService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(createTenantDto: CreateTenantDto): Promise<Prisma.Tenant>;
    findOne(id: string): Promise<Tenant | null>;
    findAll(): Promise<Tenant[]>;
    private generateSlug;
    private generateUniqueSuffix;
}
