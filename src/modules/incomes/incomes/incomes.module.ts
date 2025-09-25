import { Module } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { IncomesResolver } from './incomes.resolver';
import { Income } from '@entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Income])],
  providers: [IncomesResolver, IncomesService],
})
export class IncomesModule {}
