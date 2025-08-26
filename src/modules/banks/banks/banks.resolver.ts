import { Resolver } from '@nestjs/graphql';
import { BanksService } from './banks.service';

@Resolver()
export class BanksResolver {
  constructor(private readonly banksService: BanksService) {}
}
