import { HttpService } from '@nestjs/axios';
import { CepResponseDto } from '../dto/cep-response.dto';
export declare class CepApiService {
    private readonly httpService;
    private readonly logger;
    private readonly API_URL;
    constructor(httpService: HttpService);
    consultar(cep: string): Promise<CepResponseDto>;
}
