import type { Table } from 'dexie';
import Dexie from 'dexie';

interface Item {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  updatedAt: number;
}

export class IndexedDbUtil extends Dexie {
  items!: Table<Item, string>;

  constructor() {
    super('appdb'); // appdb is name of IndexedDb in browser
    this.version(1).stores({ items: 'id, updatedAt' });
  }
}
