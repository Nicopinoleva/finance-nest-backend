import { Test, TestingModule } from '@nestjs/testing';
import { BankAccountsTypesService } from './bank-accounts-types.service';

describe('BankAccountsTypesService', () => {
  let service: BankAccountsTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankAccountsTypesService],
    }).compile();

    service = module.get<BankAccountsTypesService>(BankAccountsTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
