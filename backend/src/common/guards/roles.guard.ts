import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { DatabaseService } from '../database/database.service';

interface BetterAuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private database: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ session?: BetterAuthSession }>();
    const session = request.session;

    if (!session || !session.user) {
      throw new ForbiddenException('No session found');
    }

    const user = await this.database.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isActive: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is deactivated');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
