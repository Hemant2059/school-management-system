import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';
import { FeeCategory } from './entities/fee-category.entity';
import { FeeStructure } from './entities/fee-structure.entity';
import { StudentFee } from './entities/student-fee.entity';
import { FeeTransaction } from './entities/fee-transaction.entity';
import { Fee } from './entities/fee.entity';
import { FeeInstallment } from './entities/fee-installment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeCategory,
      FeeStructure,
      StudentFee,
      FeeTransaction,
      Fee,
      FeeInstallment,
    ]),
  ],
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}
