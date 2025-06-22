"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger('Bootstrap');
    const port = process.env.PORT || 3000;
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableShutdownHooks();
    if (process.env.NODE_ENV === 'development') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('SmartPeças ERP API')
            .setDescription('Documentação da API para o sistema de gestão SmartPeças.')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api-docs', app, document);
        logger.log(`📄 Documentação da API disponível em http://localhost:${port}/api-docs`);
    }
    await app.listen(port);
    logger.log(`🚀 SmartPeças ERP rodando na porta: ${port}`);
    logger.log(`💡 Ambiente: ${process.env.NODE_ENV}`);
}
bootstrap();
//# sourceMappingURL=main.js.map