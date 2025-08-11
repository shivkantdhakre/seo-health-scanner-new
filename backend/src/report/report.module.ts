import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { CoreModule } from '../core/core.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  // Import other modules whose exported providers are needed here
  imports: [CoreModule],
  // Register the controller that will handle this module's routes
  controllers: [ReportController],
  // Register the services that will be used within this module
  providers: [ReportService, PrismaService],
})
export class ReportModule {}