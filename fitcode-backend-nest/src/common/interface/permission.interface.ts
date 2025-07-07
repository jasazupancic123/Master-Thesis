import { BaseEntity } from '../entity/base.entity';
import { User } from '../type/firebase-auth.type';

export abstract class Permission<
  Entity extends BaseEntity,
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
