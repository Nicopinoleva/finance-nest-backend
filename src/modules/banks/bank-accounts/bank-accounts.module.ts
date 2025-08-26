import { Module } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountsResolver } from './bank-accounts.resolver';

@Module({
  providers: [BankAccountsResolver, BankAccountsService],
})
export class BankAccountsModule {}
