import { forwardRef, Module } from '@nestjs/common';
import { CreditCardStatementService } from './credit-card-statement.service';
import { CreditCardStatementController } from './credit-card-statement.controller';
import { ExpensesModule } from '@modules/expenses/expenses/expenses.module';
import { PaymentMethodsModule } from '@modules/payment-methods/payment-methods/payment-methods.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCardStatement } from '@entities';
import { CreditCardStatementResolver } from './credit-card-statement.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditCardStatement]),
    forwardRef(() => PaymentMethodsModule),
    forwardRef(() => ExpensesModule),
  ],
  providers: [CreditCardStatementResolver, CreditCardStatementService],
  controllers: [CreditCardStatementController],
  exports: [CreditCardStatementService],
})
export class CreditCardStatementModule {}
