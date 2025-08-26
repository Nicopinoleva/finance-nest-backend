import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodsTypesResolver } from './payment-methods-types.resolver';
import { PaymentMethodsTypesService } from './payment-methods-types.service';

describe('PaymentMethodsTypesResolver', () => {
  let resolver: PaymentMethodsTypesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentMethodsTypesResolver, PaymentMethodsTypesService],
    }).compile();

    resolver = module.get<PaymentMethodsTypesResolver>(PaymentMethodsTypesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
