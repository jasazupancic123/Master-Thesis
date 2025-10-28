import type { Functions } from 'firebase/functions';

import { getFirebaseFunctions } from '@/lib/firebase/config';

export class FirebaseFunctionsUtil {
  private readonly _functions: Functions;

  constructor() {
    this._functions = getFirebaseFunctions();
  }
}
