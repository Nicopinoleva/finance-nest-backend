import { Query, Resolver } from '@nestjs/graphql';
import { CreditCardStatementService } from './credit-card-statement.service';
import { CreditCardsDebtDto } from './dto/credit-card-debt.dto';

@Resolver()
export class CreditCardStatementResolver {
  constructor(private readonly creditCardStatementService: CreditCardStatementService) {}

  @Query(() => CreditCardsDebtDto)
  async getCreditCardsDebt(): Promise<CreditCardsDebtDto> {
    const date = new Date();
    return await this.creditCardStatementService.getCreditCardDebtByMonth(date);
  }
}
