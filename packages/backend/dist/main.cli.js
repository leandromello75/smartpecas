"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nest_commander_1 = require("nest-commander");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('CLI_Bootstrap');
    try {
        await nest_commander_1.CommandFactory.run(app_module_1.AppModule, {
            logger: ['log', 'error', 'warn'],
        });
        logger.log('Comandos CLI executados com sucesso.');
    }
    catch (error) {
        logger.error('Falha ao executar comandos CLI:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.cli.js.map