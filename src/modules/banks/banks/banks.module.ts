import { Module } from '@nestjs/common';
import { BanksService } from './banks.service';
import { BanksResolver } from './banks.resolver';

@Module({
  providers: [BanksResolver, BanksService],
})
export class BanksModule {}
