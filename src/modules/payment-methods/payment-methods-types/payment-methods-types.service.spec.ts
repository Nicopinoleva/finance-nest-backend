import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodsTypesService } from './payment-methods-types.service';

describe('PaymentMethodsTypesService', () => {
  let service: PaymentMethodsTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentMethodsTypesService],
    }).compile();

    service = module.get<PaymentMethodsTypesService>(PaymentMethodsTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
