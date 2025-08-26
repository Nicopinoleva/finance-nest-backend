import { Test, TestingModule } from '@nestjs/testing';
import { BankAccountsTypesResolver } from './bank-accounts-types.resolver';
import { BankAccountsTypesService } from './bank-accounts-types.service';

describe('BankAccountsTypesResolver', () => {
  let resolver: BankAccountsTypesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankAccountsTypesResolver, BankAccountsTypesService],
    }).compile();

    resolver = module.get<BankAccountsTypesResolver>(BankAccountsTypesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
