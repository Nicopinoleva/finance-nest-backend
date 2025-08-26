import { Resolver } from '@nestjs/graphql';
import { ExpensesTypesService } from './expenses-types.service';

@Resolver()
export class ExpensesTypesResolver {
  constructor(private readonly expensesTypesService: ExpensesTypesService) {}
}
