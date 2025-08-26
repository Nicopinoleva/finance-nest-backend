import { Resolver } from '@nestjs/graphql';
import { ExpensesService } from './expenses.service';

@Resolver()
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}
}
