import { ClassConstructor, plainToInstance } from 'class-transformer';

export function serializeToDto<T, V extends Array<unknown>>(dtoClass: ClassConstructor<T>, plain: V): T[]
export function serializeToDto<T, V>(dtoClass: ClassConstructor<T>, plain: V): T
export function serializeToDto<T, V>(dtoClass: ClassConstructor<T>, plain: V | V[]): T | T[] {
  return plainToInstance(dtoClass, plain, { excludeExtraneousValues: true })
}