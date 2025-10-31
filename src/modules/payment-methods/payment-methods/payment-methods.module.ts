import { Module } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodsResolver } from './payment-methods.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from '@entities';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod])],
  providers: [PaymentMethodsResolver, PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
