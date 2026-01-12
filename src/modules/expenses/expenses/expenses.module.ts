import { forwardRef, Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesResolver } from './expenses.resolver';
import { Expense } from '@entities/expenses/expense.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '@modules/email/email.module';
import { CreditCardStatementModule } from '@modules/credit-card-statement/credit-card-statement.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense]), EmailModule, forwardRef(() => CreditCardStatementModule)],
  providers: [ExpensesResolver, ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
