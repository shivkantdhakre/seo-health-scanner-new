// backend/src/report/report.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'; // <-- Import this
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportProcessor } from './report.processor'; // <-- We will create this next
import { PrismaService } from '../prisma/prisma.service';
import { CoreModule } from '../core/core.module';

@Module({
  imports: [
    CoreModule,
    // Register the specific queue name
    BullModule.registerQueue({
      name: 'scan-queue',
    }),
  ],
  controllers: [ReportController],
  providers: [ReportService, ReportProcessor, PrismaService], // Add ReportProcessor here
})
export class ReportModule {}