import { PaymentMethod } from '@entities/payment-methods/payment-method.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async getIdByName(name: string): Promise<PaymentMethod | null> {
    const paymentMethod = await this.paymentMethodRepository.findOne({ select: { id: true }, where: { name } });
    return paymentMethod;
  }

  async getActivePaymentMethodsMap(userId: string): Promise<Map<string, PaymentMethod>> {
    const paymentMethods = await this.paymentMethodRepository.find({ where: { isActive: true, createdById: userId } });
    return paymentMethods.reduce<Map<string, PaymentMethod>>((map, paymentMethod) => {
      map.set(paymentMethod.name, paymentMethod);
      return map;
    }, new Map());
  }
}
