import type { BaseEntity } from '../entity/base.entity';
import type { User } from '../type/firebase-auth.type';

export abstract class Permission<
  Entity,
  RootEntity extends BaseEntity = never,
> {
  abstract canAdd?(user: User, root?: RootEntity): boolean | Promise<boolean>;
  abstract canView(
    user: User,
    entity: Entity,
    root?: RootEntity,
  ): boolean | Promise<boolean>;

  abstract canEdit(
    user: User,
    entity: Entity,
    root?: RootEntity,
  ): boolean | Promise<boolean>;

  abstract canDelete?(
    user: User,
    entity: Entity,
    root?: RootEntity,
  ): boolean | Promise<boolean>;
}
