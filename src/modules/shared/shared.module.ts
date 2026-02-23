import { Module, Global } from '@nestjs/common';
import { pubSubProvider } from './pubsub.provider';

@Global() // makes it available everywhere without importing SharedModule each time
@Module({
  providers: [pubSubProvider],
  exports: [pubSubProvider],
})
export class SharedModule {}
