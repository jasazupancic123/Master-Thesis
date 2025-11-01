import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

import type { UserRole } from '@src/auth/enum/user-role.enum';
import { AuthGuard } from '@src/auth/guard/auth.guard';
import { AUTH_ROLES_KEY, RoleGuard } from '@src/auth/guard/role.guard';

export function Auth(roles: UserRole[] = []) {
  return applyDecorators(
    SetMetadata(AUTH_ROLES_KEY, roles),
    UseGuards(AuthGuard, RoleGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
