import { Module } from '@nestjs/common';
import { PaymentMethodsTypesService } from './payment-methods-types.service';
import { PaymentMethodsTypesResolver } from './payment-methods-types.resolver';

@Module({
  providers: [PaymentMethodsTypesResolver, PaymentMethodsTypesService],
})
export class PaymentMethodsTypesModule {}
