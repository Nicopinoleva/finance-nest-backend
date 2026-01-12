import { Mutation, Resolver } from '@nestjs/graphql';
import { ExpensesService } from './expenses.service';
import { EmailTransaction } from '@modules/email/email.service';
import { EmailTransactionDto } from '@modules/email/dto/email-transaction.dto';

@Resolver()
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}

  @Mutation(() => [EmailTransactionDto])
  async saveUnbilledExpenses(): Promise<EmailTransaction[]> {
    return await this.expensesService.saveUnbilledExpenses();
  }
}
