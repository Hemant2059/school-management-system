import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';

// Services (RbacService) come from the global DatabaseModule — this module
// only declares the admin controller, so no import cycles are possible.
@Module({
  controllers: [RbacController],
})
export class RbacModule {}
