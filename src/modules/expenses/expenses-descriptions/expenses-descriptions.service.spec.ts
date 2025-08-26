import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesDescriptionsService } from './expenses-descriptions.service';

describe('ExpensesDescriptionsService', () => {
  let service: ExpensesDescriptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpensesDescriptionsService],
    }).compile();

    service = module.get<ExpensesDescriptionsService>(ExpensesDescriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
