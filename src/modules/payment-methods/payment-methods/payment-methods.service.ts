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
}
