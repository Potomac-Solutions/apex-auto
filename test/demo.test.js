// The public demo (DEMO=1): seeded with a working store, the sign-ins are shown, and nobody can change them.
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, openDatabase } from '../src/infra/db.js';
import { createWeb } from '../src/web/server.js';
import { seedDemo } from '../src/infra/demo-seed.js';
import { DEMO, nightly } from '../src/demo.js';

const config = { production: false, port: 0, business: 'Apex Auto Supply', zone: 'America/New_York', secret: 'x'.repeat(40), proxies: 0, publicUrl: '' };
let db, web, base, owner, counter, summary;

before(async () => {
  db = openDatabase(':memory:');
  migrate(db);
  summary = await seedDemo({ db });
  web = await createWeb({ db, config, demo: true, fetcher: async () => { throw new Error('no network'); }, ai: { enabled: false } });
  await new Promise((resolve) => web.server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${web.server.address().port}`;
  const list = web.staff.list();
  owner = list.find((one) => one.email === DEMO.owner.email);
  counter = list.find((one) => one.email === DEMO.staff.email);
});
after(async () => {
  web.server.closeAllConnections?.();
  await new Promise((resolve) => web.server.close(resolve));
  db.close();
});

test('the seed makes a store that has been working: items, regulars, weeks of calls and a queue', () => {
  assert.ok(summary.calls > 100);
  const count = (sql) => db.prepare(sql).get().n;
  assert.ok(count('SELECT COUNT(*) AS n FROM items') >= 15);
  assert.ok(count('SELECT COUNT(*) AS n FROM customers') >= 8);
  assert.ok(count("SELECT COUNT(*) AS n FROM calls WHERE status IN ('open','working','parked')") >= 5, 'some calls are open today');
  assert.ok(count("SELECT COUNT(*) AS n FROM calls WHERE status IN ('resolved','closed')") > 100, 'and many are finished');
  assert.equal(count('SELECT COUNT(*) AS n FROM portal_accounts'), 1);
});

test('every demo sign-in works', async () => {
  for (const one of [DEMO.owner, DEMO.manager, DEMO.staff]) assert.ok((await web.staff.signIn(one.email, one.password)).ok, one.email);
  assert.ok((await web.app.portal.people.signIn(DEMO.customer.username, DEMO.customer.password)).ok);
});

test('the sign-in pages show the demo sign-ins', async () => {
  const staffPage = await (await fetch(`${base}/staff/sign-in`)).text();
  for (const shown of [DEMO.owner.email, DEMO.owner.password, DEMO.manager.password, DEMO.staff.password, 'cleared overnight']) assert.ok(staffPage.includes(shown), shown);
  const guestPage = await (await fetch(`${base}/portal/login`)).text();
  for (const shown of [DEMO.customer.username, DEMO.customer.password]) assert.ok(guestPage.includes(shown), shown);
});

test('nobody can change a demo staff account', async () => {
  assert.match((await web.staff.changePassword(owner, DEMO.owner.password, 'a brand new password')).error, /demo accounts/);
  assert.match((await web.staff.setDisabled(owner, counter.account, true)).error, /demo accounts/);
  assert.match((await web.staff.setRoles(owner, counter.account, ['owner'])).error, /demo accounts/);
  assert.match((await web.staff.resetLink(owner, counter.account)).error, /demo accounts/);
  assert.equal(await web.staff.endSessions(owner.account), 0);
  assert.ok((await web.staff.signIn(DEMO.owner.email, DEMO.owner.password)).ok, 'the password still works');
});

test('other staff can still be invited and changed', async () => {
  const invite = await web.staff.invite(owner, { email: 'new@example.com', name: 'New Hand', roles: ['staff'] });
  await web.staff.accept(invite.token, { name: 'New Hand', password: 'new hand password' });
  const added = web.staff.list().find((one) => one.email === 'new@example.com');
  assert.ok((await web.staff.setDisabled(owner, added.account, true)).ok);
});

test('the demo exits once a day at the reset hour, never in its first hour', () => {
  let exits = 0;
  let at = Date.parse('2026-11-23T08:30:00Z'); // 3:30 am in New York
  const reset = nightly({ now: () => at, exit: () => { exits += 1; }, log: () => {} });
  reset.stop();
  at += 45 * 60_000; // 4:15 am, but only 45 minutes in
  assert.equal(reset.check(), false);
  at += 60 * 60_000; // 5:15 am
  assert.equal(reset.check(), false);
  at += 23 * 60 * 60_000; // 4:15 am the next day
  assert.equal(reset.check(), true);
  assert.equal(exits, 1);
});

test('without DEMO, the sign-in pages show no demo sign-ins', async () => {
  const plainDb = openDatabase(':memory:');
  migrate(plainDb);
  const plain = await createWeb({ db: plainDb, config, demo: false, ai: { enabled: false } });
  await new Promise((resolve) => plain.server.listen(0, '127.0.0.1', resolve));
  const root = `http://127.0.0.1:${plain.server.address().port}`;
  const pages = [await (await fetch(`${root}/staff/sign-in`)).text(), await (await fetch(`${root}/portal/login`)).text()];
  plain.server.closeAllConnections?.();
  await new Promise((resolve) => plain.server.close(resolve));
  plainDb.close();
  for (const page of pages) assert.ok(!page.includes(DEMO.owner.password) && !page.includes(DEMO.customer.password));
});
