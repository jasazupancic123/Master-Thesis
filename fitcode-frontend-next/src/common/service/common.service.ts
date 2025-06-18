import { ApiUtil } from '@/common/service/util/api.util';
import { DateUtil } from '@/common/service/util/date.util';
import { FirebaseAuthUtil } from '@/common/service/util/firebase-auth.util';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { ObjectUtil } from '@/common/service/util/object.util';
import { NavigationUtil } from '@/common/service/util/navigation.util';
import { GenericUtil } from './util/generic.util';
import { TreeUtil } from '@/common/service/util/tree.util';
import { BrowserUtil } from './util/browser.util';
import { FirebaseFunctionsUtil } from './util/firebase-functions.util';

export class CommonService {
  readonly firebase: {
    readonly auth: FirebaseAuthUtil;
    readonly storage: FirebaseStorageUtil;
    readonly functions: FirebaseFunctionsUtil;
  };

  readonly api: ApiUtil;
  readonly browser: BrowserUtil;
  readonly date: DateUtil;
  readonly object: ObjectUtil;
  readonly tree: TreeUtil;
  readonly navigation: NavigationUtil;
  readonly generic: GenericUtil;

  constructor() {
    this.firebase = {
      auth: new FirebaseAuthUtil(),
      storage: new FirebaseStorageUtil(),
      functions: new FirebaseFunctionsUtil(),
    };

    this.api = new ApiUtil();
    this.browser = new BrowserUtil();
    this.date = new DateUtil();
    this.object = new ObjectUtil();
    this.tree = new TreeUtil();
    this.navigation = new NavigationUtil();
    this.generic = new GenericUtil();
  }

  private static _instance: CommonService;

  static get instance() {
    return this._instance || (this._instance = new this());
  }
}
