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

  // Find an existing Google user or create/link one
  async findOrCreateGoogleUser(profile: {
    email: string;
    name: string;
    googleId: string;
  }) {
    // 1. Check if a user with this Google ID already exists
    const existingGoogleUser = await this.prisma.user.findUnique({
      where: { providerId: profile.googleId },
    });
    if (existingGoogleUser) {
      return existingGoogleUser;
    }

    // 2. Check if a user with this email exists (account linking)
    const existingEmailUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (existingEmailUser) {
      // Link the existing account with Google
      return this.prisma.user.update({
        where: { email: profile.email },
        data: {
          provider: 'google',
          providerId: profile.googleId,
          name: existingEmailUser.name || profile.name,
        },
      });
    }

    // 3. Create a brand-new Google user
    return this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        provider: 'google',
        providerId: profile.googleId,
        // password is null for Google users
      },
    });
  }
}
