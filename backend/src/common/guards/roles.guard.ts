import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { JwtPayload } from '../jwt.config.js';

/** Kiểm tra vai trò (RBAC). Dùng sau JwtAuthGuard. Admin luôn được phép. Sai quyền -> HTTP 403. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user: JwtPayload | undefined = context.switchToHttp().getRequest().user;
    const roles = user?.roles ?? [];
    if (roles.includes('Admin') || required.some((r) => roles.includes(r))) return true;
    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
  }
}
