import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Find a user by their email address
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Create a new user
  async create(email: string, hash: string) {
    return this.prisma.user.create({
      data: { email, password: hash },
    });
  }
}