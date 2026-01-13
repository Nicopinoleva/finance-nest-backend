import { Mutation, Resolver } from '@nestjs/graphql';
import { ExpensesService } from './expenses.service';
import { Expense } from '@entities';

@Resolver()
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}

  @Mutation(() => [Expense])
  async saveUnbilledExpenses(): Promise<Expense[]> {
    return await this.expensesService.saveUnbilledExpenses();
  }
}
