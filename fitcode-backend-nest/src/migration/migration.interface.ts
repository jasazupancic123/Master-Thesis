import type { Firestore } from 'firebase-admin/firestore';

export abstract class Migration {
  id: string; // unique id, e.g., '001-add-default-role'
  name: string; // human-readable name

  abstract run(db: Firestore, dryRun: boolean): Promise<void>; // apply migration
  abstract down?(db: Firestore): Promise<void>; // optional rollback
}

export class MigrationEntity {
  id: string;
  name: string;
  appliedAt: Date;
}
