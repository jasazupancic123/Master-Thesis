export abstract class Repository<T> {
  abstract create(data: T): Promise<T>;
  abstract update(id: string, data: T): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract findOneById(id: string): Promise<T>;
  abstract findAll(): Promise<T[]>;
}