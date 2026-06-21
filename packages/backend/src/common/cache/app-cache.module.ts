import { Global, Module } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InMemoryCacheService } from './in-memory-cache.service';

@Global()
@Module({
  providers: [
    InMemoryCacheService,
    {
      provide: CACHE_MANAGER,
      useExisting: InMemoryCacheService,
    },
  ],
  exports: [CACHE_MANAGER, InMemoryCacheService],
})
export class AppCacheModule {}