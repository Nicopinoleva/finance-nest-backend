import { Income } from '@entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIncomeInput } from './dto/create-income.input';

@Injectable()
export class IncomesService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeService: Repository<Income>,
  ) {}

  async create(input: CreateIncomeInput) {
    await this.incomeService.save({
      ...input,
      createdById: 'c3983079-8ad2-4057-aa26-5418e1003563',
    });
    return 'Ingreso creado exitosamente';
  }
}
