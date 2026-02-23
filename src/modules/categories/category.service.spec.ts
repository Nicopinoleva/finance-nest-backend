import { Test, TestingModule } from '@nestjs/testing';
import { IncomeTypesService } from './category.service';

describe('IncomeTypesService', () => {
  let service: IncomeTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncomeTypesService],
    }).compile();

    service = module.get<IncomeTypesService>(IncomeTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
