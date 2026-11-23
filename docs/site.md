# The public page and opening hours

The shop has no other website, so `/` is it (Apex Auto Supply is a fictional stand-in: put the real shop's details in `src/domain/shop.js`). Signed out, `/` shows the shop's page; signed in, it is Today.

## What's on it
Who we are, what we carry, services at the counter, a way into online ordering (`/portal/login`), store hours with an "open now / closes at" line, address and directions, service areas, about us, a short FAQ, and a small "Staff sign in" link in the footer. It also carries a description, a canonical link (when `PUBLIC_URL` is set) and `AutoPartsStore` structured data, plus `/robots.txt` and, with `PUBLIC_URL`, `/sitemap.xml`. Private areas (`/staff`, `/portal`, `/join`, `/hello`, `/badge`, `/d`) are disallowed.

## Pictures
The logo, badge art, app backdrops, icons and social card are in `public/`. For a photo hero, add `public/hero-photo.webp` (about 1200 x 1200); the page uses it automatically in place of `hero-art.webp`. Replace `og-image.jpg` (1200 x 630) with a matching card.

## Changing the words
Everything the page says lives in `src/domain/shop.js` (contact details, hours, services, story). The weekly hours there also drive the app.

`showPartners` is off. The source text listed local and regional businesses; naming other businesses publicly is the owner's call, so turn it on once they have agreed.

## Hours
`src/domain/hours.js` works out whether the shop is open in `TIME_ZONE`, so daylight saving needs no care. Managers add holiday closures and special hours at **Hours** (`hours.manage`); they appear on the public page and are audited. Portal customers see "We're closed. We'll see this when we open tomorrow at 7:30 AM" on the new-request page and their request list when the shop is closed.
