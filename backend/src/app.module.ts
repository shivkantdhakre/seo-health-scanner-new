// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ReportModule } from './report/report.module';
import { CoreModule } from './core/core.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true }),
    AuthModule,
    UserModule,
    ReportModule,
    CoreModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}