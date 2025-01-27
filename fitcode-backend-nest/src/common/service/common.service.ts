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
  readonly array: Util.ArrayUtil;
  readonly object: Util.ObjectUtil;
  readonly string: Util.StringUtil;

  constructor() {
    this.env = new Util.EnvUtil();
    this.color = new Util.ColorUtil();
    this.number = new Util.NumberUtil();
    this.date = new Util.DateUtil();
    this.generic = new Util.GenericUtil();
    this.tree = new Util.TreeUtil();
    this.array = new Util.ArrayUtil();
    this.object = new Util.ObjectUtil();
    this.string = new Util.StringUtil();
  }
}