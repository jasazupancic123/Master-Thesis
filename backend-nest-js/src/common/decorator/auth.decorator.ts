import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { UserRole } from '../../user/enum/user-role.enum';
import { AuthGuard } from '../guard/auth.guard';
import { RoleGuard, AUTH_ROLES_KEY } from '../guard/role.guard';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function Auth(roles: UserRole[] = []) {
  return applyDecorators(
    SetMetadata(AUTH_ROLES_KEY, roles),
    UseGuards(AuthGuard, RoleGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}