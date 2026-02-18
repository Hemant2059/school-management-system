import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { Vehicle } from './entities/vehicle.entity';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { TransportAssignment } from './entities/transport-assignment.entity';
import { TransportFee } from './entities/transport-fee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
      Route,
      RouteStop,
      TransportAssignment,
      TransportFee,
    ]),
  ],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}
