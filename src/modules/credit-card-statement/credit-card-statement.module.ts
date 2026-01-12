import { forwardRef, Module } from '@nestjs/common';
import { CreditCardStatementService } from './credit-card-statement.service';
import { CreditCardStatementController } from './credit-card-statement.controller';
import { ExpensesModule } from '@modules/expenses/expenses/expenses.module';
import { PaymentMethodsModule } from '@modules/payment-methods/payment-methods/payment-methods.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCardStatement } from '@entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditCardStatement]),
    forwardRef(() => ExpensesModule),
    forwardRef(() => PaymentMethodsModule),
  ],
  controllers: [CreditCardStatementController],
  providers: [CreditCardStatementService],
  exports: [CreditCardStatementService],
})
export class CreditCardStatementModule {}
