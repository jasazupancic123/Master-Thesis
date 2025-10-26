import type { Firestore } from 'firebase-admin/firestore';

import { Migration } from '../migration.interface';

export class InitialMigration extends Migration {
  id = '0001-initial-migration';
  name = 'Initial migration';

  async run(db: Firestore, dryRun: boolean): Promise<void> {
    const snapshot = await db.collection('test').limit(1).get();

    for (const doc of snapshot.docs) {
      // eslint-disable-next-line no-console
      if (dryRun) console.log(`Dry run: would delete document ${doc.id}`);
      else await doc.ref.delete();
    }
  }

  async down(__db: Firestore): Promise<void> {}
}
