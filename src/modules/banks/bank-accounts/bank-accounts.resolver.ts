import { Resolver } from '@nestjs/graphql';
import { BankAccountsService } from './bank-accounts.service';

@Resolver()
export class BankAccountsResolver {
  constructor(private readonly bankAccountsService: BankAccountsService) {}
}
