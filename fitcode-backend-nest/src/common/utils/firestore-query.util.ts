// firestore-query-logger.util.ts
import { Query } from '@google-cloud/firestore';
import type { Logger } from '@nestjs/common';

export function logFirestoreQuery(
  logger: Logger,
  builderFn: (q: Query) => Query,
): (q: Query) => Query {
  return (q: Query) => {
    const logs: string[] = [];
    const proxy = createLoggingQueryProxy(q, logs);

    const startBuild = Date.now();
    const result = builderFn(proxy);
    const endBuild = Date.now();

    // Wrap the final `get` to measure execution time
    const originalGet = result.get.bind(result);
    result.get = async (...args: any[]) => {
      const startExec = Date.now();
      const snap = await originalGet(...args);
      const endExec = Date.now();

      const buildDuration = endBuild - startBuild;
      const execDuration = endExec - startExec;

      logger.debug(
        `[Firestore Query]: ${logs.join('.')} | Build time: ${buildDuration}ms | Execution time: ${execDuration}ms`,
      );

      return snap;
    };

    return result;
  };
}

function createLoggingQueryProxy(query: Query, logCollector: string[]): Query {
  const firestoreMethodsToLog = [
    'where',
    'orderBy',
    'limit',
    'offset',
    'startAt',
    'endAt',
  ];

  return new Proxy(query, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);

      if (typeof original === 'function')
        return (...args: any[]) => {
          // log only Firestore builder methods
          if (firestoreMethodsToLog.includes(prop as string))
            logCollector.push(getLog(prop, args));

          // if the result is another Query, wrap it in a proxy as well
          const result = original.apply(target, args);
          if (result instanceof Query)
            return createLoggingQueryProxy(result, logCollector);

          return result;
        };

      return original;
    },
  });
}

function getLog(prop: string | symbol, args: any[]): string {
  return `${String(prop)}(${args
    .map((a) => {
      if (a instanceof Date) return `'${a.toISOString()}'`;
      if (a?.toDate && typeof a.toDate === 'function')
        return `'${a.toDate().toISOString()}'`; // Firestore Timestamp

      if (typeof a === 'string') return `'${a}'`;
      return a;
    })
    .join(',')})`;
}
