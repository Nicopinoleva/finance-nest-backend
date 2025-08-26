import { Resolver } from '@nestjs/graphql';
import { PaymentMethodsTypesService } from './payment-methods-types.service';

@Resolver()
export class PaymentMethodsTypesResolver {
  constructor(private readonly paymentMethodsTypesService: PaymentMethodsTypesService) {}
}
