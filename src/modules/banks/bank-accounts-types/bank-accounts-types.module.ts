import { Module } from '@nestjs/common';
import { BankAccountsTypesService } from './bank-accounts-types.service';
import { BankAccountsTypesResolver } from './bank-accounts-types.resolver';

@Module({
  providers: [BankAccountsTypesResolver, BankAccountsTypesService],
})
export class BankAccountsTypesModule {}
