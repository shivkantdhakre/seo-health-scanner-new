import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  // Register PrismaService as a provider within this module
  providers: [UserService, PrismaService],
  // Export UserService to make it available for injection in other modules
  exports: [UserService],
})
export class UserModule {}