// The shop's public page: who we are, what we carry, when we're open, where to find us, and a way in
// to order parts online. Everything it says comes from src/domain/shop.js.
import { existsSync } from 'node:fs';
import { esc } from './html.js';
import { layout, logoHtml } from './ui.js';
import { SHOP } from '../domain/shop.js';
import { openingSpec, weekTable } from '../domain/hours.js';

// Drop a photo here (public/hero-photo.webp, about 1200 x 1200) and the hero uses it instead of the badge art.
const HERO_PHOTO = new URL('../../public/hero-photo.webp', import.meta.url);

const tel = (shop) => `tel:${shop.phoneLink}`;
const mapsUrl = (a) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.street}, ${a.city}, ${a.state} ${a.zip}`)}`;
const ICON = {
  target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8zM12 11.2a.8.8 0 100 1.6.8.8 0 000-1.6z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  people: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.5a3 3 0 010 5.5M18 14c2 .7 3 2.7 3 6',
  car: 'M3 15l2-6h14l2 6v4h-3v-2H6v2H3zM6 15h12M7 12h10',
  engine: 'M4 9h3l1-2h6l1 2h3v7h-3l-1 2H8l-1-2H4zM2 12h2M20 12h2',
  brakes: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 9a3 3 0 100 6 3 3 0 000-6z',
  spring: 'M12 3v3l-4 2 8 3-8 3 8 3-4 2v3',
  bolt: 'M13 2L5 14h6l-1 8 8-12h-6z',
  drop: 'M12 3s6 6 6 10a6 6 0 01-12 0c0-4 6-10 6-10z',
  pipe: 'M3 9h11a5 5 0 015 5v1M3 15h8',
  gear: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  body: 'M5 17V9l3-4h8l3 4v8M5 13h14M8 17v2M16 17v2',
  battery: 'M3 8h15v10H3zM18 11h3v4h-3M7 11v4M5 13h4',
  wrench: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  recycle: 'M20 11a8 8 0 00-14-4M4 4v4h4M4 13a8 8 0 0014 4M20 20v-4h-4',
};
const list = (rows) => `<ul class="cards">${rows.map(([h, t]) => `<li><strong>${esc(h)}</strong><span>${esc(t)}</span></li>`).join('')}</ul>`;
const svgIcon = (d) => `<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg></span>`;

/** Structured data for search engines: the shop as a local business. Everything in it is escaped for a script tag. */
export function jsonLd(shop, url) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    '@id': `${url || ''}/#shop`,
    name: shop.name,
    areaServed: [{ '@type': 'City', name: shop.address.city }, ...shop.serviceAreas.map(([state]) => ({ '@type': 'State', name: state }))],
    hasMap: mapsUrl(shop.address),
    ...(url ? { image: [`${url}/assets/og-image.jpg`], logo: `${url}/assets/icon-512.png` } : {}),
    makesOffer: [...shop.categories, ...shop.specialties].map(([name, description]) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, description } })),
    description: shop.tagline,
    telephone: shop.phone,
    email: shop.email,
    foundingDate: String(shop.founded),
    ...(url ? { url } : {}),
    address: { '@type': 'PostalAddress', streetAddress: shop.address.street, addressLocality: shop.address.city, addressRegion: shop.address.state, postalCode: shop.address.zip, addressCountry: 'US' },
    openingHoursSpecification: openingSpec(shop.hours),
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function createSite({ config, app, now, shop = SHOP }) {
  const base = () => (config.publicUrl ? config.publicUrl.replace(/\/$/, '') : '');
  const originOf = (req) => (req?.headers?.host ? `${req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.headers.host}` : '');

  function body() {
    const state = app.hours.state();
    const closures = app.hours.upcoming(30);
    const week = weekTable(now(), config.zone, shop.hours);
    const a = shop.address;
    const year = new Date(now()).getUTCFullYear();
    const years = year - shop.founded;
    const days = Object.keys(shop.hours).length;
    const facts = [
      [`${years}+`, 'Years serving the area'],
      [`${days} days`, 'A week, open'],
      ['Free', 'Battery and charging tests'],
      [shop.delivers ? 'We deliver' : 'Special orders', shop.delivers ? 'Parts to your door' : 'Not on the shelf? Ask'],
    ];
    const cards = (rows, icons = []) => `<ul class="tiles">${rows.map(([h, t], i) => `<li>${icons[i] ? svgIcon(icons[i]) : ''}<h3>${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ul>`;
    const photo = existsSync(HERO_PHOTO);
    const art = photo
      ? `<div class="art photo"><img src="/assets/hero-photo.webp" width="1200" height="1200" alt="Auto parts at ${esc(shop.name)}" fetchpriority="high"></div>`
      : `<div class="art"><img src="/assets/hero-art.webp" width="1200" height="1200" alt="${esc(shop.name)}" fetchpriority="high"></div>`;
    return `
<header class="top">
  <div class="wrap bar">
    ${logoHtml(shop.name)}
    <nav aria-label="Main"><a href="#parts">Parts</a><a href="#services">Services</a><a href="#online">Order online</a><a href="#hours">Hours</a><a href="#find">Find us</a></nav>
    <a class="btn accent" href="${tel(shop)}">Call<span class="num">&nbsp;${esc(shop.phone)}</span></a>
  </div>
</header>

<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <p class="pill">${esc(shop.tagline)}</p>
      <h1>${esc(shop.name)}</h1>
      <p class="big">Find the right part. <span>Get back on the road.</span></p>
      <p class="lede">${esc(shop.intro)}</p>
      <p class="open-now ${state.open ? 'is-open' : 'is-closed'}" role="status"><span class="dot" aria-hidden="true"></span>${esc(state.text)}</p>
      <div class="actions">
        <a class="btn accent lg" href="${tel(shop)}">Call ${esc(shop.phone)}</a>
        <a class="btn light lg" href="/portal/login">Order parts online</a>
        <a class="btn ghost lg" href="${esc(mapsUrl(a))}" rel="noopener">Directions</a>
      </div>
    </div>
    ${art}
  </div>
</section>

<section class="band" aria-label="At a glance"><div class="wrap facts">${facts.map(([v, l]) => `<div><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`).join('')}</div></section>

<section class="sec" id="why"><div class="wrap">
  <header class="head"><p class="kicker">Why us</p><h2>Why shop with us</h2></header>
  ${cards(shop.why, [ICON.target, ICON.shield, ICON.people, ICON.car])}
</div></section>

<section class="sec alt" id="parts"><div class="wrap">
  <header class="head"><p class="kicker">What we carry</p><h2>Parts for cars, trucks and equipment</h2><p>Domestic and import.</p></header>
  ${cards(shop.categories, [ICON.engine, ICON.brakes, ICON.spring, ICON.bolt, ICON.drop, ICON.pipe, ICON.gear, ICON.body])}
</div></section>

<section class="sec dark" id="services"><div class="wrap">
  <header class="head"><p class="kicker">More than parts</p><h2>Services at the counter</h2></header>
  ${cards(shop.specialties, [ICON.battery, ICON.wrench, ICON.box, ICON.recycle])}
</div></section>

<section class="sec" id="online"><div class="wrap split">
  <div>
    <header class="head left"><p class="kicker">Order online</p><h2>Send us a request any time</h2></header>
    <ol class="steps">
      <li><b>01</b><div><h3>Tell us what you need</h3><p>Add your vehicle, photos and measurements, or just describe the part.</p></div></li>
      <li><b>02</b><div><h3>We find it</h3><p>We check requests as soon as we open and get back to you.</p></div></li>
      <li><b>03</b><div><h3>${shop.delivers ? 'Pick it up or have it delivered' : 'Pick it up'}</h3><p>Watch it move from received to ready.</p></div></li>
    </ol>
    <div class="actions"><a class="btn primary lg" href="/portal/login">Sign in to order parts</a></div>
    <p class="muted">No account yet? Ask at the counter or call us and we’ll send you a link.</p>
  </div>
  <aside class="card">
    <h3>Need parts after hours?</h3>
    <p>${esc(shop.afterHours)}</p>
    <p><a class="btn outline" href="/portal/login">Start a request</a></p>
  </aside>
</div></section>

<section class="sec pros" id="pros"><div class="wrap split">
  <div><header class="head left"><p class="kicker">Professionals and fleets</p><h2>Built for the people who fix things</h2></header>
    <p>Mechanics, body shops and fleet managers get ${shop.professionals.map((x) => esc(x.toLowerCase())).join(', ')}. Call us, or ask for an account.</p>
    <div class="actions"><a class="btn accent lg" href="${tel(shop)}">Call ${esc(shop.phone)}</a></div></div>
  <ul class="checks">${shop.professionals.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
</div></section>

<section class="sec alt" id="hours"><div class="wrap two">
  <div class="card">
    <h2>Store hours</h2>
    <table class="hours"><tbody>${week.map((r) => `<tr${r.today ? ' class="today"' : ''}><th scope="row">${esc(r.day)}</th><td>${esc(r.hours)}</td></tr>`).join('')}</tbody></table>
    ${closures.length ? `<h3>Coming up</h3><ul class="plain">${closures.map((c) => `<li><span>${esc(new Date(`${c.date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }))}</span><span>${esc(c.open ? `${c.note ? `${c.note}: ` : ''}special hours` : c.note ? `Closed (${c.note})` : 'Closed')}</span></li>`).join('')}</ul>` : '<p class="muted">Call ahead for holiday hours.</p>'}
  </div>
  <div class="card" id="find">
    <h2>Find us</h2>
    <address>${esc(a.street)}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</address>
    <p>${esc(shop.directions)}</p>
    <p><a href="${tel(shop)}">${esc(shop.phone)}</a> · <a href="mailto:${esc(shop.email)}">${esc(shop.email)}</a></p>
    <p><a class="btn primary" href="${esc(mapsUrl(a))}" rel="noopener">Get directions</a></p>
    <h3>${shop.delivers ? 'Where we serve and deliver' : 'Where we serve'}</h3>
    ${shop.delivers ? '<p>We deliver parts around our service area. Ask when you call, or choose delivery when you order online.</p>' : ''}
    <ul class="plain">${shop.serviceAreas.map(([state2, towns]) => `<li><span><strong>${esc(state2)}</strong> ${esc(towns)}</span></li>`).join('')}</ul>
  </div>
</div></section>

<section class="sec" id="about"><div class="wrap split">
  <div>
    <header class="head left"><p class="kicker">About us</p><h2>Since ${esc(String(shop.founded))}</h2></header>
    <p class="story">${esc(shop.story)}</p>
  </div>
  <ul class="checks light">${shop.commitments.map(([h, t]) => `<li><strong>${esc(h)}</strong><span>${esc(t)}</span></li>`).join('')}</ul>
</div></section>

<section class="sec alt" id="faq"><div class="wrap narrow">
  <header class="head"><p class="kicker">Good to know</p><h2>Questions</h2></header>
  <div class="faq">${shop.faq.map(([q, ans]) => `<details><summary>${esc(q)}</summary><p>${esc(ans)}</p></details>`).join('')}</div>
</div></section>

<section class="cta"><div class="wrap">
  <h2>Ready when you are</h2>
  <p>Call the counter, stop in, or send a request online.</p>
  <div class="actions center"><a class="btn accent lg" href="${tel(shop)}">Call ${esc(shop.phone)}</a><a class="btn ghost lg" href="/portal/login">Order parts online</a></div>
</div></section>

${shop.showPartners ? `<section class="sec alt" id="partners"><div class="wrap"><header class="head"><h2>Shops we work with</h2></header><h3>Around town</h3>${list(shop.partners.local)}<h3>Around the region</h3>${list(shop.partners.regional)}</div></section>` : ''}

<footer class="foot"><div class="wrap">
  <p><strong>${esc(shop.name)}</strong> · ${esc(a.street)}, ${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)} · <a href="${tel(shop)}">${esc(shop.phone)}</a></p>
  <p class="muted">© ${year} ${esc(shop.name)} · <a href="/staff/sign-in">Staff sign in</a></p>
</div></footer>`;
  }

  /** The home page for someone who isn't signed in. */
  function render(res, zubraPage, req) {
    const url = base() || originOf(req);
    const a = shop.address;
    const title = `${shop.name} | Auto Parts in ${a.city}, ${a.state}`;
    const description = `${shop.name} in ${a.city}, ${a.state}: quality auto parts, batteries, brakes and special orders. Call ${shop.phone}.`;
    const image = url ? `${url}/assets/og-image.jpg` : '/assets/og-image.jpg';
    const alt = `${shop.name}, an auto parts store in ${a.city}, ${a.state}`;
    const head = `<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(shop.name)}">${url ? `\n<link rel="canonical" href="${esc(url)}/">` : ''}
<meta property="og:site_name" content="${esc(shop.name)}"><meta property="og:type" content="website"><meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}">${url ? `<meta property="og:url" content="${esc(url)}/">` : ''}
<meta property="og:image" content="${esc(image)}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"><meta name="twitter:image:alt" content="${esc(alt)}">
<meta name="format-detection" content="telephone=yes">
<script type="application/ld+json">${jsonLd(shop, url)}</script>`;
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache',
      'content-security-policy': res.csp,
      'x-content-type-options': 'nosniff',
    });
    res.end(zubraPage.finish(layout({ title: shop.name, fullTitle: title, who: null, body: body(), business: shop.name, head, sub: '', bodyClass: 'site', bare: true, index: true })));
  }

  const robots = () => `User-agent: *\nDisallow: /staff\nDisallow: /portal\nDisallow: /join/\nDisallow: /hello/\nDisallow: /badge/\nDisallow: /d/\nAllow: /\n${base() ? `Sitemap: ${base()}/sitemap.xml\n` : ''}`;
  const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(base())}/</loc><lastmod>${new Date(now()).toISOString().slice(0, 10)}</lastmod></url></urlset>\n`;

  const manifest = () => JSON.stringify({
    name: shop.name, short_name: shop.name.split(' ').slice(0, 2).join(' '), description: shop.tagline, start_url: '/', scope: '/', display: 'standalone',
    background_color: '#0a1633', theme_color: '#0b132b',
    icons: [{ src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
  });

  return { render, manifest, robots, sitemap, hasUrl: () => Boolean(base()) };
}
