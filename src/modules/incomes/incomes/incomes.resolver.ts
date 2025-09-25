import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IncomesService } from './incomes.service';
import { CreateIncomeInput } from './dto/create-income.input';

@Resolver()
export class IncomesResolver {
  constructor(private readonly incomesService: IncomesService) {}

  @Mutation(() => String)
  createIncome(@Args('input') createIncomeInput: CreateIncomeInput) {
    return this.incomesService.create(createIncomeInput);
  }
}
