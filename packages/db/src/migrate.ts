import { promises as fs } from 'fs';
import path from 'path';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { getDb } from './index';

async function migrate() {
  const db = getDb('online');

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, 'migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((r: { status: string; migrationName: string }) => {
    if (r.status === 'Success') {
      console.log(`✓ ${r.migrationName}`);
    } else if (r.status === 'Error') {
      console.error(`✗ ${r.migrationName}`);
    }
  });

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  await db.destroy();
}

migrate();
