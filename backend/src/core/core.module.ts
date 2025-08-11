import { Module } from '@nestjs/common';
import { CoreService } from './core.service';

@Module({
  // Register CoreService as a provider
  providers: [CoreService],
  // Export CoreService so it can be used by other modules
  exports: [CoreService],
})
export class CoreModule {}