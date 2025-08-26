import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesDescriptionsResolver } from './expenses-descriptions.resolver';
import { ExpensesDescriptionsService } from './expenses-descriptions.service';

describe('ExpensesDescriptionsResolver', () => {
  let resolver: ExpensesDescriptionsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpensesDescriptionsResolver, ExpensesDescriptionsService],
    }).compile();

    resolver = module.get<ExpensesDescriptionsResolver>(ExpensesDescriptionsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
