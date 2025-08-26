import { Module } from '@nestjs/common';
import { ExpensesTypesService } from './expenses-types.service';
import { ExpensesTypesResolver } from './expenses-types.resolver';

@Module({
  providers: [ExpensesTypesResolver, ExpensesTypesService],
})
export class ExpensesTypesModule {}
