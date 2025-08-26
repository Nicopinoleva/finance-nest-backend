import { Resolver } from '@nestjs/graphql';
import { ExpensesDescriptionsService } from './expenses-descriptions.service';

@Resolver()
export class ExpensesDescriptionsResolver {
  constructor(private readonly expensesDescriptionsService: ExpensesDescriptionsService) {}
}
