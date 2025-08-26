import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesTypesService } from './expenses-types.service';

describe('ExpensesTypesService', () => {
  let service: ExpensesTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpensesTypesService],
    }).compile();

    service = module.get<ExpensesTypesService>(ExpensesTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
