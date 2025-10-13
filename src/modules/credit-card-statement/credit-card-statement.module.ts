import { Module } from '@nestjs/common';
import { CreditCardStatementService } from './credit-card-statement.service';
import { CreditCardStatementController } from './credit-card-statement.controller';
import { ExpensesModule } from '@modules/expenses/expenses/expenses.module';

@Module({
  imports: [ExpensesModule],
  controllers: [CreditCardStatementController],
  providers: [CreditCardStatementService],
})
export class CreditCardStatementModule {}
