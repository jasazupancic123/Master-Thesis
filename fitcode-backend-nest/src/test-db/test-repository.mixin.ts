import type { FirestoreRootRepository } from '@src/common/type/firestore.type';

type Constructor<T = {}> = abstract new (...args: any[]) => T;

export function TestRepositoryMixin<Model extends object>() {
  return function <TBase extends Constructor<FirestoreRootRepository<Model>>>(
    Base: TBase,
  ) {
    abstract class TestRepository extends Base {
      async deleteCollection(): Promise<void> {
        await this.firebaseService.deleteCollection(this.collectionName);
      }
    }

    return TestRepository;
  };
}
