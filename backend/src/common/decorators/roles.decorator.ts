import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Giới hạn route chỉ cho các vai trò chỉ định: @Roles('Admin', 'Ke toan', 'Dieu hanh') */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
