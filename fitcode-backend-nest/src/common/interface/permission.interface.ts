import type { BaseEntity } from '../entity/base.entity';
import type { FirebaseUser } from '../type/firebase-auth.type';

export abstract class Permission<
  Entity,
  RootEntity extends BaseEntity = never,
> {
  abstract canAdd?(
    user: FirebaseUser,
    root?: RootEntity,
  ): boolean | Promise<boolean>;

  abstract canView(
    user: FirebaseUser,
    entity: Entity,
    root?: RootEntity,
  ): boolean | Promise<boolean>;

  abstract canEdit(
    user: FirebaseUser,
    entity: Entity,
    root?: RootEntity,
  ): boolean | Promise<boolean>;

  abstract canDelete?(
    user: FirebaseUser,
    entity: Entity,
    root?: RootEntity,
  ): boolean | Promise<boolean>;
}
