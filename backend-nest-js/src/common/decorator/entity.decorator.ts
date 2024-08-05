import { Inject } from '@nestjs/common';

export const ENTITY_METADATA_KEY = Symbol('ENTITY_METADATA_KEY');

export function Entity(collectionName: string) {
  return function(target: any) {
    Reflect.defineMetadata(ENTITY_METADATA_KEY, collectionName, target);
  };
}

export function getEntityMetadata(target: Function): string {
  return Reflect.getMetadata(ENTITY_METADATA_KEY, target);
}

export function getRepositoryToken(entity: Function) {
  return entity.name + 'Repository';
}

export function InjectRepository(entity: Function) {
  return Inject(getRepositoryToken(entity));
}