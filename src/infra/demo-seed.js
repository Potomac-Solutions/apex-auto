// The public demo's data: three staff sign-ins, a parts catalog, regulars, three weeks of calls
// (answered, quoted, sold, parked, finished) and a few still open today, and one customer with an
// online account. Everything is made up, and everything is dated relative to now, so the reports
// and the queue always look like a store that has been working.
//
//   seedDemo({ db })   on an empty, migrated database
import { createStaff } from '../../vendor/kit/staff/index.js';
import { sqliteStore } from './documents-store.js';
import { createApp } from '../app/index.js';
import { ROLES } from '../domain/permissions.js';
import { DEMO } from '../demo.js';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const SEED = 20260401;

// A small deterministic generator, so a reset looks like the day before, not like a different store.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ITEMS = [
  { sku: 'OF-4967', name: 'Oil filter, spin-on', brand: 'Wix', price: '7.25' },
  { sku: 'OF-5040', name: 'Oil filter, cartridge', brand: 'Fram', price: '6.49' },
  { sku: 'AF-3112', name: 'Engine air filter', brand: 'Wix', price: '16.80' },
  { sku: 'CF-1190', name: 'Cabin air filter', brand: 'Fram', price: '14.95' },
  { sku: 'BP-1210', name: 'Ceramic brake pads, front', brand: 'Wagner', price: '48.99' },
  { sku: 'BR-5589', name: 'Brake rotor, vented 12 in', brand: 'Raybestos', price: '61.40' },
  { sku: 'WP-540', name: 'Water pump, 5.4L Ford', brand: 'Gates', price: '89.99' },
  { sku: 'TH-195', name: 'Thermostat, 195 degree', brand: 'Stant', price: '12.25' },
  { sku: 'BT-H6', name: 'Battery, group 48 (H6), 730 CCA', brand: 'DieHard', price: '154.99', unit: 'each' },
  { sku: 'BT-65', name: 'Battery, group 65, 850 CCA', brand: 'DieHard', price: '174.99', unit: 'each' },
  { sku: 'SP-9663', name: 'Iridium spark plug', brand: 'NGK', price: '9.99' },
  { sku: 'WB-4425', name: 'Serpentine belt', brand: 'Gates', price: '34.50' },
  { sku: 'WS-2218', name: 'Wiper blade, 22 in', brand: 'Rain-X', price: '13.99' },
  { sku: 'HB-9005', name: 'Headlight bulb, 9005', brand: 'Sylvania', price: '18.75' },
  { sku: 'AL-8240', name: 'Alternator, remanufactured', brand: 'Delco', price: '189.00', unit: 'each' },
  { sku: 'ST-3350', name: 'Starter, remanufactured', brand: 'Delco', price: '164.00', unit: 'each' },
  { sku: '6205-2RS', name: 'Sealed ball bearing 25x52x15', brand: 'SKF', price: '9.49' },
  { sku: 'HF-34', name: 'Hydraulic fitting, 3/4 hose', brand: 'Parker', price: '14.00', unit: 'each' },
  { sku: 'AT-5Q', name: 'Synthetic motor oil, 5 qt', brand: 'Mobil 1', price: '31.99' },
  { sku: 'CL-GAL', name: 'Coolant, 50/50, gallon', brand: 'Prestone', price: '17.49' },
];

const CUSTOMERS = [
  { name: 'Fairview Fleet Services', kind: 'organization', tier: 'fleet', account_no: 'A-100', phones: [{ phone: '555-010-2201', label: 'dispatch' }], notes: 'Twelve work trucks. Net 30. Ask for the fleet price.' },
  { name: 'Hollow Creek Farms', kind: 'organization', tier: 'pro', account_no: 'A-118', phones: [{ phone: '555-010-2230', label: 'office' }, { phone: '555-010-2231', label: 'shop' }], notes: 'Case and John Deere equipment. Pays on account.' },
  { name: 'Summit Ridge Auto Repair', kind: 'organization', tier: 'pro', account_no: 'A-131', phones: [{ phone: '555-010-2260', label: 'shop' }], notes: 'Two bays. Orders before 10 for same-day delivery.' },
  { name: 'Dale Weaver', kind: 'person', phones: [{ phone: '555-010-2377', label: 'cell' }], notes: '2008 F-150 5.4L.' },
  { name: 'Priya Natarajan', kind: 'person', phones: [{ phone: '555-010-2412', label: 'cell' }], notes: '2015 Honda Civic. Likes to see the old part.' },
  { name: 'Mason Duffy', kind: 'person', phones: [{ phone: '555-010-2459', label: 'cell' }], notes: 'Weekend rebuilds, mostly Chevy small blocks.' },
  { name: 'Lakeshore Towing', kind: 'organization', tier: 'fleet', account_no: 'A-150', phones: [{ phone: '555-010-2500', label: 'garage' }], notes: 'Wrecker and flatbed parts. Calls early.' },
  { name: 'Carla Jimenez', kind: 'person', phones: [{ phone: '555-010-2538', label: 'cell' }] },
  { name: 'Old Mill Bakery', kind: 'organization', tier: 'retail', phones: [{ phone: '555-010-2570', label: 'office' }], notes: 'Delivery van, a 2012 Ford Transit.' },
  { name: 'Evan Shultz', kind: 'person', phones: [{ phone: '555-010-2611', label: 'cell' }] },
];

// What people ask for. `kind` decides how the call ends.
const REQUESTS = [
  { request: 'Water pump for a 2008 F-150', parts: 'WP-540', app: { year: '2008', make: 'Ford', model: 'F-150', engine: '5.4L V8' }, item: 'WP-540', usual: 'sold' },
  { request: 'Front brake pads and rotors, wants both quoted', parts: 'BP-1210, BR-5589', app: { year: '2015', make: 'Honda', model: 'Civic', engine: '1.8L' }, item: 'BP-1210', usual: 'quoted' },
  { request: 'Group 65 battery, truck won’t crank', parts: 'BT-65', app: { year: '2016', make: 'Ford', model: 'F-250', engine: '6.2L V8' }, item: 'BT-65', usual: 'sold' },
  { request: 'Oil change kit: oil, filter, drain plug washer', parts: 'AT-5Q, OF-4967', app: { year: '2012', make: 'Chevrolet', model: 'Silverado 1500', engine: '5.3L V8' }, item: 'AT-5Q', usual: 'sold' },
  { request: 'Serpentine belt squealing, needs the right length', parts: 'WB-4425', app: { year: '2013', make: 'Toyota', model: 'Camry', engine: '2.5L' }, item: 'WB-4425', usual: 'sold' },
  { request: 'Alternator for a bakery van, remanufactured is fine', parts: 'AL-8240', app: { year: '2012', make: 'Ford', model: 'Transit 250', engine: '3.7L V6' }, item: 'AL-8240', usual: 'quoted' },
  { request: 'Hydraulic fitting for a loader, brought the old one in photos', parts: 'HF-34', app: { freeform: 'Case 580 backhoe, loader arm' }, item: 'HF-34', usual: 'sold' },
  { request: 'Spark plugs, set of eight', parts: 'SP-9663', app: { year: '2010', make: 'Dodge', model: 'Ram 1500', engine: '5.7L Hemi' }, item: 'SP-9663', usual: 'sold' },
  { request: 'Bearing for a wheelbarrow, 25 mm bore', parts: '6205-2RS', app: { freeform: 'Wheelbarrow, 25 mm bore' }, item: '6205-2RS', usual: 'sold' },
  { request: 'Transmission cooler lines for a 1998 Cherokee', parts: '', app: { year: '1998', make: 'Jeep', model: 'Cherokee', engine: '4.0L' }, item: null, usual: 'unavailable' },
  { request: 'Starter, remanufactured, needs it today', parts: 'ST-3350', app: { year: '2011', make: 'Chevrolet', model: 'Malibu', engine: '2.4L' }, item: 'ST-3350', usual: 'sold' },
  { request: 'Wants a price on a complete cooling job', parts: 'WP-540, TH-195, CL-GAL', app: { year: '2008', make: 'Ford', model: 'F-150', engine: '5.4L V8' }, item: 'TH-195', usual: 'quoted' },
  { request: 'Cabin and engine air filters', parts: 'CF-1190, AF-3112', app: { year: '2019', make: 'Subaru', model: 'Outback', engine: '2.5L' }, item: 'CF-1190', usual: 'sold' },
  { request: 'Headlight bulbs, both sides', parts: 'HB-9005', app: { year: '2014', make: 'Chevrolet', model: 'Equinox', engine: '2.4L' }, item: 'HB-9005', usual: 'sold' },
  { request: 'Wiper blades, front and rear', parts: 'WS-2218', app: { year: '2017', make: 'Nissan', model: 'Rogue', engine: '2.5L' }, item: 'WS-2218', usual: 'sold' },
  { request: 'Looking for a cheaper brake pad than what we carry', parts: 'BP-1210', app: { year: '2009', make: 'Pontiac', model: 'G6', engine: '3.5L' }, item: 'BP-1210', usual: 'no-sale' },
  { request: 'Differential seal for a flatbed, unsure of the part', parts: '', app: { freeform: 'Wrecker, rear differential seal' }, item: null, usual: 'callback' },
  { request: 'Wheel hub assembly, front left', parts: '', app: { year: '2011', make: 'Hyundai', model: 'Sonata', engine: '2.4L' }, item: null, usual: 'callback' },
];

const NAMES = ['Ray', 'Denise', 'Walt', 'Marcus', 'Gail', 'Terrence', 'Colleen', 'Nate', 'Alma', 'Hugh', 'Beth', 'Gus'];
const NOTES = ['Will stop by after work.', 'Has the old part.', 'Wants delivery to the shop.', 'Ask about the warranty.', 'Regular, knows the counter.', ''];

export async function seedDemo({ db, now = Date.now(), log = () => {} } = {}) {
  const rand = mulberry32(SEED);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const between = (low, high) => low + Math.floor(rand() * (high - low + 1));

  // ---- the three staff accounts, with the kit's own sign-up (so passwords are hashed as usual) ----
  const store = sqliteStore(db);
  const staff = createStaff({ store, roles: ROLES, invites: { manager: ['staff'] }, name: 'call-store', secure: false });
  const first = await staff.accept(await staff.setup(), { name: DEMO.owner.name, email: DEMO.owner.email, password: DEMO.owner.password });
  if (first.error) throw new Error(first.error);
  const ownerWho = { account: first.account, email: DEMO.owner.email, name: DEMO.owner.name, roles: ['owner'] };
  for (const [one, roles] of [[DEMO.manager, ['manager']], [DEMO.staff, ['staff']]]) {
    const invite = await staff.invite(ownerWho, { email: one.email, name: one.name, roles });
    const made = await staff.accept(invite.token, { name: one.name, password: one.password });
    if (made.error) throw new Error(made.error);
  }

  // ---- the shop's side of the app, on a clock this function moves ----
  const clock = { t: now - 21 * DAY };
  const app = createApp({ db, now: () => clock.t, business: 'Apex Auto Supply' });
  const who = {
    owner: { email: DEMO.owner.email, name: DEMO.owner.name, roles: ['owner'] },
    manager: { email: DEMO.manager.email, name: DEMO.manager.name, roles: ['manager'] },
    staff: { email: DEMO.staff.email, name: DEMO.staff.name, roles: ['staff'] },
  };
  const crew = [who.staff, who.staff, who.manager, who.owner];

  const itemIds = new Map();
  for (const item of ITEMS) {
    const made = app.items.create(who.manager, item);
    if (made.error) throw new Error(`item ${item.sku}: ${made.error}`);
    itemIds.set(item.sku, made.id);
  }
  const customerIds = [];
  for (const customer of CUSTOMERS) {
    const made = app.customers.create(who.manager, customer);
    if (made.error) throw new Error(`customer ${customer.name}: ${made.error}`);
    customerIds.push(made.id);
  }

  // ---- three weeks of calls ----
  const start = new Date(clock.t);
  const dayStart = (offset) => {
    const d = new Date(now - offset * DAY);
    d.setHours(8, 0, 0, 0);
    return d.getTime();
  };
  let placed = 0;
  for (let ago = 21; ago >= 1; ago--) {
    const day = new Date(dayStart(ago)).getDay();
    const count = day === 0 ? between(2, 3) : day === 6 ? between(5, 7) : between(8, 11);
    const times = Array.from({ length: count }, () => between(0, 9 * 60)).sort((a, b) => a - b);
    for (const minute of times) {
      const ask = pick(REQUESTS);
      const regular = rand() < 0.55 ? pick(customerIds) : null;
      const who1 = pick(crew);
      clock.t = dayStart(ago) + minute * MIN;
      const made = app.calls.create(who1, {
        caller_name: regular ? '' : pick(NAMES),
        caller_phone: regular ? '' : `555-010-${between(3000, 3999)}`,
        request: ask.request, part_numbers: ask.parts, application: ask.app, notes: pick(NOTES), quantity: ask.item && rand() < 0.15 ? between(2, 4) : '',
      }, { customerId: regular });
      if (made.error) throw new Error(`call: ${made.error}`);
      // Picked up within a few minutes, mostly.
      clock.t += between(0, 9) * MIN;
      app.calls.claim(who1, made.id);
      if (ask.item) app.calls.addItem(who1, made.id, itemIds.get(ask.item), 1);
      if (rand() < 0.2) {
        clock.t += between(3, 20) * MIN;
        app.calls.wait(who1, made.id, rand() < 0.5 ? 'ordered' : 'customer');
        clock.t += between(1, 6) * HOUR;
        app.calls.move(who1, made.id, 'working');
      }
      clock.t += between(3, 25) * MIN;
      const outcome = rand() < 0.82 ? ask.usual : pick(['sold', 'quoted', 'no-sale', 'callback']);
      const sold = outcome === 'sold';
      app.calls.finish(who1, made.id, {
        outcome,
        ...(sold || outcome === 'quoted' ? { final_parts: ask.parts || ask.request, price: String(between(7, 190) + (between(0, 99) / 100)) } : {}),
        ...(sold ? { final_quantity: '1' } : {}),
        resolution: outcome === 'unavailable' ? 'Not stocked; pointed them to the dealer.' : outcome === 'callback' ? 'Needs the VIN. Will call back with the part number.' : '',
      }, rand() < 0.35 ? 'resolved' : 'closed');
      placed++;
    }
  }

  // ---- today: a queue to work ----
  const today = [
    { by: who.staff, claim: false, ask: REQUESTS[0], customer: customerIds[3], ago: 4, note: 'Truck is at his house. Wants to pick it up before noon.' },
    { by: who.staff, claim: true, ask: REQUESTS[1], customer: customerIds[4], ago: 22 },
    { by: who.manager, claim: true, ask: REQUESTS[5], customer: customerIds[8], ago: 48, help: true },
    { by: who.staff, claim: false, ask: REQUESTS[9], customer: null, ago: 9, caller: 'Hugh' },
    { by: who.manager, claim: true, ask: REQUESTS[11], customer: customerIds[2], ago: 95, park: 'ordered' },
    { by: who.staff, claim: true, ask: REQUESTS[6], customer: customerIds[1], ago: 140 },
    { by: who.owner, claim: false, ask: REQUESTS[2], customer: customerIds[0], ago: 2, priority: 'high' },
  ];
  const nowMs = Math.max(now, Date.now());
  for (const one of today) {
    clock.t = nowMs - one.ago * MIN;
    const made = app.calls.create(one.by, {
      caller_name: one.customer ? '' : one.caller ?? 'Hugh', caller_phone: one.customer ? '' : '555-010-3921',
      request: one.ask.request, part_numbers: one.ask.parts, application: one.ask.app, notes: one.note ?? '', priority: one.priority ?? 'normal',
    }, { customerId: one.customer });
    if (made.error) throw new Error(`today call: ${made.error}`);
    if (one.claim) {
      clock.t += 3 * MIN;
      app.calls.claim(one.by, made.id);
      if (one.ask.item) app.calls.addItem(one.by, made.id, itemIds.get(one.ask.item), 1);
    }
    if (one.help) app.calls.requestHelp(one.by, made.id, '');
    if (one.park) { clock.t += 5 * MIN; app.calls.wait(one.by, made.id, one.park); }
  }

  // A nudge or two for the counter, so the inbox isn't empty.
  clock.t = nowMs - 12 * MIN;
  const open = app.calls.queue(who.manager, { view: 'open' });
  const target = open.calls?.find((c) => c.assignee === DEMO.manager.email) ?? open.calls?.[0];
  if (target) app.nudges.send(who.manager, { to: DEMO.staff.email, callId: target.id, message: 'Can you take a look at this one when you get a second?' });

  // ---- one customer with an online account ----
  const business = customerIds[0];
  clock.t = nowMs - 2 * HOUR;
  const invite = await app.portal.people.invite(who.manager, business, { name: DEMO.customer.name, via: 'qr', origin: 'https://example.invalid' });
  if (invite.error) throw new Error(`portal invite: ${invite.error}`);
  const joined = await app.portal.people.joinWithPassword(invite.token, { name: DEMO.customer.name, username: DEMO.customer.username, password: DEMO.customer.password });
  if (joined.error) throw new Error(`portal join: ${joined.error}`);

  clock.t = nowMs;
  log(`Demo data: ${ITEMS.length} items, ${CUSTOMERS.length} customers, ${placed} finished calls, ${today.length} in the queue.`);
  return { items: ITEMS.length, customers: CUSTOMERS.length, calls: placed + today.length, from: start.toISOString() };
}
