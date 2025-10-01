import type { FirestoreRepository } from '@src/common/type/firestore.type';

type Constructor<T = {}> = abstract new (...args: any[]) => T;

export function TestRepositoryMixin<Model extends object, Ref = string>() {
  return function <TBase extends Constructor<FirestoreRepository<Model, Ref>>>(
    Base: TBase,
  ) {
    abstract class TestRepository extends Base {
      async clear(): Promise<void> {
        await this.firebase.deleteCollection(this.collectionName);
      }
    }

    return TestRepository;
  };
}
