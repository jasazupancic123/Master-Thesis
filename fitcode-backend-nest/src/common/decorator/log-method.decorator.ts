import { Logger } from '@nestjs/common';

import type { FirebaseUser } from '../type/firebase-auth.type';

function isPrimitive(val: any): boolean {
  return (
    val === null ||
    typeof val === 'undefined' ||
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean'
  );
}

function isFirebaseUser(val: any): val is FirebaseUser {
  return val && typeof val === 'object' && typeof val.uid === 'string';
}

export function LogMethod(): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const methodName = propertyKey.toString();
      const logger = new Logger(target.constructor.name);

      const argList = args
        .map((arg) => {
          let value: string;

          if (isFirebaseUser(arg)) value = `userId=${arg.uid}`;
          else if (isPrimitive(arg)) value = String(arg);
          else
            try {
              value = JSON.stringify(arg);
            } catch {
              value = '[Unserializable]';
            }

          return value;
        })
        .join(', ');

      logger.log(`${methodName}(${argList})`);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
