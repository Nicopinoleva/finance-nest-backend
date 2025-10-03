import { Module } from '@nestjs/common';
import { CreditCardStatementService } from './credit-card-statement.service';
import { CreditCardStatementController } from './credit-card-statement.controller';

@Module({
  controllers: [CreditCardStatementController],
  providers: [CreditCardStatementService],
})
export class CreditCardStatementModule {}
