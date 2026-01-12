import { Category } from '@entities';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterTypeOrm } from '@nestjs-cls/transactional-adapter-typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryInput } from './dto/create-category.input';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly expenseRepository: Repository<Category>,
    private readonly txHost: TransactionHost<TransactionalAdapterTypeOrm>,
  ) {}

  @Transactional()
  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const category = this.expenseRepository.create({
      name: input.name,
      description: input.description,
      parentCategoryId: input.parentCategoryId,
      createdById: 'c3983079-8ad2-4057-aa26-5418e1003563',
    });
    return this.expenseRepository.save(category);
  }
}
