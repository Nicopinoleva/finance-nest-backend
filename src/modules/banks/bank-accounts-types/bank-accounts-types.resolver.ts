import { Resolver } from '@nestjs/graphql';
import { BankAccountsTypesService } from './bank-accounts-types.service';

@Resolver()
export class BankAccountsTypesResolver {
  constructor(private readonly bankAccountsTypesService: BankAccountsTypesService) {}
}
