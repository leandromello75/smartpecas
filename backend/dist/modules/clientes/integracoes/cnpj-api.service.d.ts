import { HttpService } from '@nestjs/axios';
import { CnpjResponseDto } from '../dto/cnpj-response.dto';
export declare class CnpjApiService {
    private readonly httpService;
    private readonly logger;
    private readonly API_URL;
    constructor(httpService: HttpService);
    consultar(cnpj: string): Promise<CnpjResponseDto>;
}
