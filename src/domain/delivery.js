// Delivery rules: which towns the shop's own delivery area covers, what a delivery record may hold,
// and the stages it goes through. Pure.
import { SHOP } from './shop.js';

const STATE = Object.fromEntries('Alabama AL,Alaska AK,Arizona AZ,Arkansas AR,California CA,Colorado CO,Connecticut CT,Delaware DE,Florida FL,Georgia GA,Hawaii HI,Idaho ID,Illinois IL,Indiana IN,Iowa IA,Kansas KS,Kentucky KY,Louisiana LA,Maine ME,Maryland MD,Massachusetts MA,Michigan MI,Minnesota MN,Mississippi MS,Missouri MO,Montana MT,Nebraska NE,Nevada NV,New Hampshire NH,New Jersey NJ,New Mexico NM,New York NY,North Carolina NC,North Dakota ND,Ohio OH,Oklahoma OK,Oregon OR,Pennsylvania PA,Rhode Island RI,South Carolina SC,South Dakota SD,Tennessee TN,Texas TX,Utah UT,Vermont VT,Virginia VA,Washington WA,West Virginia WV,Wisconsin WI,Wyoming WY'.split(',').map((x) => { const i = x.lastIndexOf(' '); return [x.slice(0, i), x.slice(i + 1)]; }));
export const STATUSES = Object.freeze(['requested', 'ready', 'out', 'delivered']);
export const STATUS_LABEL = Object.freeze({ requested: 'Asked for', ready: 'Ready to go', out: 'Out for delivery', delivered: 'Delivered' });
/** What a person can do next from each stage. */
export const NEXT = Object.freeze({ requested: ['ready', 'out', 'delivered'], ready: ['out', 'delivered'], out: ['delivered'], delivered: [] });

/** The delivery towns, from the shop's service areas: `{ value: 'Brookside, OH', town: 'Brookside' }`. */
export function deliveryTowns(shop = SHOP) {
  return shop.serviceAreas.flatMap(([state, towns]) => towns.split(',').map((t) => t.trim()).filter(Boolean).map((town) => ({ town, value: `${town}, ${STATE[state] ?? state}` })));
}

const plain = (value, max) => String(value ?? '').replace(/[\u0000-\u001f\u007f<>]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** Is this town inside the usual delivery area? Compared without case or the state suffix. */
export function inArea(town, shop = SHOP) {
  const t = plain(town, 80).toLowerCase().replace(/,\s*[a-z. ]+$/, '').replace(/^mt\.?\s/, 'mountain ');
  return deliveryTowns(shop).some((x) => x.town.toLowerCase().replace(/^mt\.?\s/, 'mountain ') === t);
}

/**
 * What was typed, made tidy: `{ ok, town, address, note, outside }`, or `{ error: 'address' }` when
 * there's nowhere to take it. `known` is the address on the customer's account, or `true` when the
 * shop knows where they are without one written down: then nothing has to be typed.
 */
export function cleanDelivery(input, shop = SHOP, { known = false } = {}) {
  const town = plain(input?.town, 60);
  const address = plain(input?.address, 200) || (typeof known === 'string' ? plain(known, 200) : '');
  const note = plain(input?.note, 200);
  if (!address && !known) return { error: 'address' };
  return { ok: true, town, address, note, outside: town ? !inArea(town, shop) : !known };
}
