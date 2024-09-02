import { Injectable } from '@nestjs/common';
import * as Util from './util';

@Injectable()
export class CommonService {
  readonly env: Util.EnvUtil;
  readonly color: Util.ColorUtil;
  readonly number: Util.NumberUtil;
  readonly date: Util.DateUtil;
  readonly generic: Util.GenericUtil;
  readonly tree: Util.TreeUtil;

  constructor() {
    this.env = new Util.EnvUtil();
    this.color = new Util.ColorUtil();
    this.number = new Util.NumberUtil();
    this.date = new Util.DateUtil();
    this.generic = new Util.GenericUtil();
    this.tree = new Util.TreeUtil();
  }
}