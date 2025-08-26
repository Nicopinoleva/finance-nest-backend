import { Test, TestingModule } from '@nestjs/testing';
import { IncomeTypesResolver } from './income-types.resolver';
import { IncomeTypesService } from './income-types.service';

describe('IncomeTypesResolver', () => {
  let resolver: IncomeTypesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncomeTypesResolver, IncomeTypesService],
    }).compile();

    resolver = module.get<IncomeTypesResolver>(IncomeTypesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
