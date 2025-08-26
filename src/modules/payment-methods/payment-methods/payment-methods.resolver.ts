import { Resolver } from '@nestjs/graphql';
import { PaymentMethodsService } from './payment-methods.service';

@Resolver()
export class PaymentMethodsResolver {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}
}
