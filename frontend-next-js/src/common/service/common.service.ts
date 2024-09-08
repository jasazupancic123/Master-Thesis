import { ApiUtil } from '@/common/service/util/api.util';
import { DateUtil } from '@/common/service/util/date.util';
import { FirebaseAuthUtil } from '@/common/service/util/firebase-auth.util';
import { FirebaseFirestoreUtil } from '@/common/service/util/firebase-firestore.util';
import { FirebaseStorageUtil } from '@/common/service/util/firebase-storage.util';
import { ObjectUtil } from '@/common/service/util/object.util';
import { MuiUtil } from '@/common/service/util/mui.util';
import { NavigationUtil } from '@/common/service/util/navigation.util';
import { GenericUtil } from './util/generic.util';
import { BASE_URL } from '@/common/constant/api.constant';
import { FetchOptions } from '@/common/type/api.type';

export class CommonService {
  private static _instance: CommonService;

  readonly firebase: {
    readonly auth: FirebaseAuthUtil;
    readonly firestore: FirebaseFirestoreUtil;
    readonly storage: FirebaseStorageUtil;
  };

  readonly api: ApiUtil;
  readonly date: DateUtil;
  readonly object: ObjectUtil;
  readonly navigation: NavigationUtil;
  readonly mui: MuiUtil;
  readonly generic: GenericUtil;

  constructor() {
    this.firebase = {
      auth: new FirebaseAuthUtil(),
      firestore: new FirebaseFirestoreUtil(),
      storage: new FirebaseStorageUtil(),
    };

    this.api = new ApiUtil();
    this.date = new DateUtil();
    this.object = new ObjectUtil();
    this.navigation = new NavigationUtil();
    this.mui = new MuiUtil();
    this.generic = new GenericUtil();
  }

  static get instance() {
    return this._instance || (this._instance = new this());
  }
}