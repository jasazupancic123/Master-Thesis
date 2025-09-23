import { Injectable, Logger } from '@nestjs/common';

import { Migration } from './migration.interface';
import { MigrationRepository } from './migration.repository';
import { InitialMigration } from './migrations/0001-initial-migration';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  private readonly migrations: Migration[] = [
    new InitialMigration(),
    // add more migrations here
  ];

  constructor(private readonly repository: MigrationRepository) {}

  async runMigrations(dryRun = false) {
    const db = this.repository.firebaseService.firestore;

    for (const migration of this.migrations) {
      const applied = await this.repository.doc(migration.id).get();
      if (applied.exists) {
        this.logger.log(`Skipping ${migration.id} (${migration.name})`);
        continue;
      }

      this.logger.log(`Running ${migration.id} (${migration.name})...`);
      const startTime = performance.now();
      await migration.run(db, dryRun);
      const endTime = performance.now();
      this.logger.log(
        `Finished ${migration.id} in ${(endTime - startTime).toFixed(2)} ms`,
      );

      await this.repository.save({
        id: migration.id,
        name: migration.name,
        appliedAt: new Date(),
      });
    }
  }

  async rollbackMigration(id: string) {
    const db = this.repository.firebaseService.firestore;
    const migration = this.migrations.find((m) => m.id === id);
    if (!migration) {
      this.logger.warn(`Migration ${id} not found`);
      return;
    }

    if (!migration.down) {
      this.logger.warn(`Migration ${id} has no down() method`);
      return;
    }

    this.logger.log(`Rolling back ${migration.id} (${migration.name})...`);
    const startTime = performance.now();
    await migration.down(db);
    const endTime = performance.now();
    this.logger.log(
      `Finished rollback of ${migration.id} in ${(endTime - startTime).toFixed(
        2,
      )} ms`,
    );

    await this.repository.delete(migration.id);
  }
}
