// `npm run demo`: start the public demo from scratch. Wipe the database, seed it, then serve.
// Railway's "always" restart policy plus the nightly exit in src/demo.js give a daily reset.
import { rmSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

process.env.DEMO = '1';
// A demo that resets every night has nothing worth backing up.
process.env.BACKUP_EVERY_HOURS ??= '0';

const { config } = await import('./config.js');
const { migrate, openDatabase } = await import('./db.js');
const { seedDemo } = await import('./demo-seed.js');

if (config.database !== ':memory:') {
  mkdirSync(dirname(config.database), { recursive: true });
  for (const suffix of ['', '-wal', '-shm']) rmSync(config.database + suffix, { force: true });
}
const db = openDatabase(config.database);
migrate(db);
console.log((await seedDemo({ db, log: console.log })) && 'Demo seeded.');
db.close();
await import('../server.js');
