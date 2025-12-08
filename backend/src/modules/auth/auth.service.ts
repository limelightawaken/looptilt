import { Injectable } from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService) {}

  async createUser(email: string, password: string, name: string, role = 'USER') {
    const hashedPassword = await hashPassword(password);

    const user = await this.database.user.create({
      data: {
        name,
        email,
        emailVerified: true,
        role: role as 'USER' | 'ADMIN',
      },
    });

    await this.database.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
      },
    });

    return user;
  }

  async findUserById(id: string) {
    return this.database.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.database.user.findUnique({
      where: { email },
    });
  }

  async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    return this.database.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
