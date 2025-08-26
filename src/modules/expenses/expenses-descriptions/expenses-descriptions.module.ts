import { Module } from '@nestjs/common';
import { ExpensesDescriptionsService } from './expenses-descriptions.service';
import { ExpensesDescriptionsResolver } from './expenses-descriptions.resolver';

@Module({
  providers: [ExpensesDescriptionsResolver, ExpensesDescriptionsService],
})
export class ExpensesDescriptionsModule {}
