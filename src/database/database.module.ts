import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TenantService } from './tenant.service';
import { RbacService } from './rbac.service';
import { SeedService } from './seed.service';

@Global()
@Module({
  providers: [DatabaseService, TenantService, RbacService, SeedService],
  exports: [DatabaseService, TenantService, RbacService],
})
export class DatabaseModule {}
