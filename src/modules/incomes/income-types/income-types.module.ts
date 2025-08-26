import { Module } from '@nestjs/common';
import { IncomeTypesService } from './income-types.service';
import { IncomeTypesResolver } from './income-types.resolver';

@Module({
  providers: [IncomeTypesResolver, IncomeTypesService],
})
export class IncomeTypesModule {}
