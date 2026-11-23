// What the public page and the app's opening hours say about the shop. Edit this file to change them.
// (Holiday closures are not here: managers add those from the Hours page.)
//
// Apex Auto Supply is a fictional business: swap in a real shop's details and the whole page follows.

export const SHOP = Object.freeze({
  name: 'Apex Auto Supply',
  tagline: 'Your neighborhood auto parts store',
  founded: 2003,
  phone: '(555) 010-0142',
  phoneLink: '+15550100142',
  email: 'hello@apexautosupply.example',
  address: { street: '1200 Summit Ridge Road', city: 'Fairview', state: 'OH', zip: '44000' },
  directions: 'Just off Main Street, with plenty of parking right out front.',
  // Parts are delivered across the service areas below. Set to false if that stops being true.
  delivers: true,
  afterHours: 'Send us a request any time through online ordering and we’ll pick it up the moment we open. For the best selection and pricing, call us or stop in during store hours.',
  // Naming other businesses on a public page is the owner’s call: turn this on once they’ve agreed.
  showPartners: false,
  // Minutes after midnight, local time. A day left out is closed all day.
  hours: Object.freeze({
    mon: [450, 1080], tue: [450, 1080], wed: [450, 1080], thu: [450, 1080], fri: [450, 1080],
    sat: [450, 1020],
    sun: [540, 960],
  }),
  intro: 'Apex Auto Supply is your source for quality parts, honest advice and fast answers. Whether you’re a weekend DIYer, a working mechanic or a fleet manager, we’ll help you find the right part the first time.',
  why: [
    ['Right part, first time', 'Bring your VIN, plate or the old part and we’ll match it.'],
    ['Quality you can trust', 'Trusted brands and a real warranty behind what we sell.'],
    ['Knowledgeable staff', 'Friendly people who know cars, trucks and equipment.'],
    ['Domestic and import', 'A deep catalog for the vehicles on your street.'],
  ],
  categories: [
    ['Engine', 'Oil, filters, spark plugs, belts, gaskets'],
    ['Brakes', 'Pads, rotors, drums, hydraulic components'],
    ['Suspension and steering', 'Shocks, struts, springs, steering components'],
    ['Electrical', 'Batteries, starters, alternators, lighting'],
    ['Cooling', 'Radiators, pumps, thermostats, coolants'],
    ['Exhaust', 'Mufflers, converters, exhaust pipes'],
    ['Drivetrain', 'Transmission parts, CV joints, driveline'],
    ['Body and trim', 'Mirrors, lights, wipers, weatherstripping'],
  ],
  specialties: [
    ['Free battery and charging tests', 'We’ll test yours before you buy a new one.'],
    ['Tool loaner program', 'Borrow specialty tools for the job with a refundable deposit.'],
    ['Special orders', 'Not on the shelf? We can usually get it fast.'],
    ['Oil and battery recycling', 'Bring in your used oil, batteries and cores.'],
  ],
  professionals: ['Volume pricing', 'Special ordering', 'Technical support', 'Fast turnaround'],
  story: 'Apex Auto Supply opened in 2003 with a simple idea: the person behind the counter should know the part, the vehicle and the job.',
  commitments: [
    ['Honest advice', 'If you don’t need it, we’ll tell you.'],
    ['Fair prices', 'Competitive pricing, with volume rates for the trade.'],
    ['Answers, fast', 'Call, stop in or send a request online. We get back to you.'],
  ],
  faq: [
    ['Can you look up a part with my VIN?', 'Yes. Bring your VIN, license plate or the old part, or send them with an online request, and we’ll match the right one.'],
    ['Can I order parts outside store hours?', 'Yes. Send a request online any time and we’ll see it when we open.'],
    ['Do you test batteries?', 'Yes, battery and charging-system tests are free.'],
    ['Do you take back old parts?', 'We recycle used oil and batteries, and take cores for parts that carry a core charge.'],
  ],
  serviceAreas: [
    ['Ohio', 'Fairview, Brookside, Cedar Hollow, Millbrook, Ridgeway, Stonebridge, Mountain View'],
    ['Pennsylvania', 'Elm Grove, Lakemont, Orchard Park, Pine Ridge, Westbrook, Kingsley, Harlan'],
  ],
  partners: { local: [], regional: [] },
});
