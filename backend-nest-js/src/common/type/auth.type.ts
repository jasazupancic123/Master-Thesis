import { User } from './firebase-auth.type';
import { UnauthorizedException } from '@nestjs/common';

export abstract class CanViewService<Ref> {
  abstract canView(user: User, ref: Ref): boolean | Promise<boolean>;

  protected async authorize(user: User, ref: Ref): Promise<void> {
    const permitted = await this.canView(user, ref);
    if (!permitted) throw new UnauthorizedException('You cannot view this resource');
  }
}