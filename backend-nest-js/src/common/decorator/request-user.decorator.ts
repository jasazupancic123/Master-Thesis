import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../type/custom-claims.type';

export const RequestUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
  },
);