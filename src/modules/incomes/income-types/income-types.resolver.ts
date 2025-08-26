import { Resolver } from '@nestjs/graphql';
import { IncomeTypesService } from './income-types.service';

@Resolver()
export class IncomeTypesResolver {
  constructor(private readonly incomeTypesService: IncomeTypesService) {}
}
