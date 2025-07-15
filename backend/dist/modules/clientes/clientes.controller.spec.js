"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const clientes_controller_1 = require("./clientes.controller");
describe('ClientesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [clientes_controller_1.ClientesController],
        }).compile();
        controller = module.get(clientes_controller_1.ClientesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=clientes.controller.spec.js.map