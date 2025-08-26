import { Module } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { IncomesResolver } from './incomes.resolver';

@Module({
  providers: [IncomesResolver, IncomesService],
})
export class IncomesModule {}
