import { Mutation, Resolver, Subscription } from '@nestjs/graphql';
import { ExpensesService } from './expenses.service';
import { Expense } from '@entities';
import { LogMessage } from '@modules/shared/dto/logMessage.dto';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from '@modules/shared/pubsub.provider';
import { PubSub } from 'graphql-subscriptions';

@Resolver()
export class ExpensesResolver {
  constructor(
    private readonly expensesService: ExpensesService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => [Expense])
  async saveUnbilledExpenses(): Promise<Expense[]> {
    return await this.expensesService.saveUnbilledExpenses();
  }

  @Subscription(() => LogMessage)
  expenseLogs() {
    return this.pubSub.asyncIterableIterator('EXPENSE_LOGS');
  }
}
