import { CommonService } from './common/common.service';
import { FirebaseService } from './firebase/firebase.service';
import { MaterialUIService } from './material-ui/material-ui.service';

class Lib {
  readonly common: CommonService;
  readonly firebase: FirebaseService;
  readonly mui: MaterialUIService;

  constructor() {
    this.common = new CommonService();
    this.firebase = new FirebaseService();
    this.mui = new MaterialUIService();
  }
}

export const lib = new Lib();
