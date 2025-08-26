import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesTypesResolver } from './expenses-types.resolver';
import { ExpensesTypesService } from './expenses-types.service';

describe('ExpensesTypesResolver', () => {
  let resolver: ExpensesTypesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpensesTypesResolver, ExpensesTypesService],
    }).compile();

    resolver = module.get<ExpensesTypesResolver>(ExpensesTypesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
