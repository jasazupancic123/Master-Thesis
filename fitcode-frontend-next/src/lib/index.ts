import { AIService } from '../core/exercise-ai-prescriptions/ai.service';
import { CommonService } from './common/common.service';
import { FirebaseService } from './firebase/firebase.service';
import { MaterialUIService } from './material-ui/material-ui.service';

class Lib {
  readonly common: CommonService;
  readonly firebase: FirebaseService;
  readonly mui: MaterialUIService;
  readonly ai: AIService;

  constructor() {
    this.common = new CommonService();
    this.firebase = new FirebaseService();
    this.mui = new MaterialUIService();
    this.ai = new AIService();
  }
}

export const lib = new Lib();
