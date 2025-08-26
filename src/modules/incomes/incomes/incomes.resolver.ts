import { Resolver } from '@nestjs/graphql';
import { IncomesService } from './incomes.service';

@Resolver()
export class IncomesResolver {
  constructor(private readonly incomesService: IncomesService) {}
}
