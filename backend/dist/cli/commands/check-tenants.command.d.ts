import { CommandRunner } from 'nest-commander';
import { PrismaService } from '../../prisma/prisma.service';
export declare class CheckTenantsCommand extends CommandRunner {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    run(): Promise<void>;
}
