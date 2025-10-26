import { DateUtil } from './service/date.util';
import { EnvUtil } from './service/env.util';
import { GenericUtil } from './service/generic.util';
import { ComponentUtil } from './service/icons.util';
import { IndexedDbUtil } from './service/indexed-db.util';
import { NavigationUtil } from './service/navigation.util';
import { NumberUtil } from './service/number.util';
import { ObjectUtil } from './service/object.util';
import { TreeUtil } from './service/tree.util';

export class CommonService {
  readonly env: EnvUtil;
  readonly date: DateUtil;
  readonly object: ObjectUtil;
  readonly tree: TreeUtil;
  readonly nav: NavigationUtil;
  readonly generic: GenericUtil;
  readonly number: NumberUtil;
  readonly component: ComponentUtil;
  readonly indexedDb: IndexedDbUtil;

  constructor() {
    this.env = new EnvUtil();
    this.date = new DateUtil();
    this.object = new ObjectUtil();
    this.tree = new TreeUtil();
    this.nav = new NavigationUtil();
    this.generic = new GenericUtil();
    this.number = new NumberUtil();
    this.component = new ComponentUtil();
    this.indexedDb = new IndexedDbUtil();
  }
}
