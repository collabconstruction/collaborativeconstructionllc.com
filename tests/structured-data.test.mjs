import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { jsonld, SITE } from '../lib/schema.js';

// Real data, not synthetic fixtures: a regression here means the actual
// production JSON-LD broke, not that a fake fixture drifted from reality.
const business = JSON.parse(fs.readFileSync(new URL('../src/_data/business.json', import.meta.url)));
const people = JSON.parse(fs.readFileSync(new URL('../src/_data/people.json', import.meta.url)));
const services = JSON.parse(fs.readFileSync(new URL('../src/_data/services.json', import.meta.url))).list;

// The real front matter of every page that renders base.njk's JSON-LD block.
// Mirrors what Nunjucks actually passes to the `jsonld` filter (see base.njk).
const pages = [
  { url: '/', title: 'Collaborative Construction, LLC' },
  { url: '/about/', title: 'About | Collaborative Construction, LLC', schemaType: 'about', schemaName: 'About Collaborative Construction', breadcrumbName: 'About' },
  { url: '/gallery/', title: 'Gallery | Collaborative Construction, LLC', schemaType: 'gallery', schemaName: 'Project Gallery', breadcrumbName: 'Gallery' },
  { url: '/construction-advisory/', title: 'Construction Management | Collaborative Construction, LLC', schemaType: 'services', schemaName: 'Construction Management' },
  { url: '/adu-builder-cape-cod/', title: 'ADU Builder on Cape Cod | Collaborative Construction, LLC', description: 'ADU construction on Cape Cod.', schemaType: 'service', schemaName: 'ADU Builder Cape Cod', breadcrumbName: 'ADU Builder' },
  { url: '/custom-home-builder-cape-cod/', title: 'Custom Home Builder on Cape Cod | Collaborative Construction, LLC', description: 'Custom home building on Cape Cod.', schemaType: 'service', schemaName: 'Custom Home Builder Cape Cod', breadcrumbName: 'Custom Homes' },
  { url: '/home-additions-cape-cod/', title: 'Home Additions on Cape Cod | Collaborative Construction, LLC', description: 'Home additions on Cape Cod.', schemaType: 'service', schemaName: 'Home Additions Cape Cod', breadcrumbName: 'Home Additions' },
  { url: '/home-renovation-cape-cod/', title: 'Home Renovation on Cape Cod | Collaborative Construction, LLC', description: 'Home renovation on Cape Cod.', schemaType: 'service', schemaName: 'Home Renovation Cape Cod', breadcrumbName: 'Home Renovation' },
  { url: '/general-contractor-falmouth-ma/', title: 'General Contractor in Falmouth, MA | Collaborative Construction, LLC', description: 'General contracting in Falmouth, MA.', schemaType: 'service', schemaName: 'General Contractor Falmouth', breadcrumbName: 'General Contractor' },
];

const SERVICE_PAGE_URLS = pages.filter(p => p.schemaType === 'service').map(p => p.url);

function render(page) {
  const raw = jsonld({ ...page, business, people, services });
  return JSON.parse(raw); // throws if the filter ever emits invalid JSON
}

test('every page emits parseable JSON-LD with a non-empty @graph', () => {
  for (const page of pages) {
    const doc = render(page);
    assert.equal(doc['@context'], 'https://schema.org');
    assert.ok(Array.isArray(doc['@graph']) && doc['@graph'].length > 0, `${page.url} has an empty graph`);
  }
});

test('no page emits two nodes with the same @id', () => {
  for (const page of pages) {
    const doc = render(page);
    const ids = doc['@graph'].map(n => n['@id']).filter(Boolean);
    assert.equal(ids.length, new Set(ids).size, `duplicate @id within ${page.url}`);
  }
});

test('no node ever carries fabricated review/rating markup', () => {
  // Regression guard for the explicit constraint: this business has no
  // verified reviews, so aggregateRating/review must never appear anywhere.
  for (const page of pages) {
    const doc = render(page);
    const serialized = JSON.stringify(doc);
    assert.ok(!/"aggregateRating"|"review"\s*:/.test(serialized), `fabricated review markup on ${page.url}`);
  }
});

test('unset business facts (cslNumber, legalName, founded) are omitted, never emitted as null', () => {
  assert.equal(business.cslNumber, null, 'fixture assumption: cslNumber is still unset in business.json');
  const doc = render(pages.find(p => p.schemaType === 'about'));
  const serialized = JSON.stringify(doc);
  assert.ok(!serialized.includes('null'), 'a null business fact leaked into JSON-LD instead of being pruned');
});

test('every dedicated service page emits exactly one Service node tied to its own URL', () => {
  for (const page of pages.filter(p => p.schemaType === 'service')) {
    const doc = render(page);
    const serviceNodes = doc['@graph'].filter(n => n['@type'] === 'Service');
    assert.equal(serviceNodes.length, 1, `${page.url} should have exactly one Service node`);
    const svc = serviceNodes[0];
    assert.equal(svc['@id'], `${SITE}${page.url}#service`);
    assert.equal(svc.provider['@id'], `${SITE}/#business`, 'Service.provider must reference the single business node');
    assert.equal(svc.description, page.description, 'Service description must reuse the page\'s own reviewed copy, not invent new text');

    const webpage = doc['@graph'].find(n => n['@id'] === `${SITE}${page.url}#webpage`);
    assert.ok(webpage, 'service page must still emit its WebPage node');
    assert.equal(webpage.mainEntity['@id'], svc['@id'], 'WebPage.mainEntity must point at the page\'s own Service node');
  }
});

test('construction-advisory keeps its multi-service node and is not affected by the single-service-page feature', () => {
  const doc = render(pages.find(p => p.url === '/construction-advisory/'));
  const serviceNodes = doc['@graph'].filter(n => n['@type'] === 'Service');
  assert.equal(serviceNodes.length, services.length);
  for (const n of serviceNodes) assert.ok(n['@id'].startsWith(`${SITE}/construction-advisory#`));
});

test('every non-home page links isPartOf back to the single #website node', () => {
  for (const page of pages.filter(p => p.url !== '/')) {
    const doc = render(page);
    const webpage = doc['@graph'].find(n => n['@id'].endsWith('#webpage'));
    assert.equal(webpage.isPartOf['@id'], `${SITE}/#website`);
  }
});

test('the home page emits exactly one business, one website, one webpage node — no duplicates across the whole graph', () => {
  const doc = render(pages[0]);
  const types = doc['@graph'].map(n => (Array.isArray(n['@type']) ? n['@type'].join('+') : n['@type']));
  assert.ok(types.some(t => t.includes('GeneralContractor')));
  assert.ok(types.includes('WebSite'));
  assert.ok(types.includes('WebPage'));
  assert.equal(doc['@graph'].length, 3);
});

test('SERVICE_PAGE_URLS fixture matches the five dedicated service landing pages (sanity check for this test file itself)', () => {
  assert.deepEqual(
    [...SERVICE_PAGE_URLS].sort(),
    [
      '/adu-builder-cape-cod/',
      '/custom-home-builder-cape-cod/',
      '/general-contractor-falmouth-ma/',
      '/home-additions-cape-cod/',
      '/home-renovation-cape-cod/',
    ].sort()
  );
});

/* ---------------------------------------------------------- brand identity */
/* Search Console, 28 days to 2026-10-13: "collaborative construction" drew 71
   impressions at average position 8.2 with zero clicks, and "collaborate
   construction" another 16 at position 43.6. The company is losing its own
   name to other firms sharing it. These assertions protect the entity signals
   added to fix that, because all three are the kind of thing a well-meaning
   edit silently drops. */

const homeBusiness = () =>
  render(pages[0])['@graph'].find(n => Array.isArray(n['@type']) && n['@type'].includes('GeneralContractor'));

test('the business node claims the short name people actually search as alternateName', () => {
  const node = homeBusiness();
  assert.equal(node.name, business.name);
  assert.equal(node.alternateName, business.shortName,
    'alternateName must carry the short form ("Collaborative Construction"); that is the query drawing the impressions');
  assert.notEqual(node.name, node.alternateName, 'alternateName adds nothing if it merely repeats name');
});

test('the Google Business Profile is present in the business sameAs', () => {
  const sameAs = homeBusiness().sameAs;
  assert.ok(sameAs.includes(business.social.googleBusinessProfile),
    'the GBP is the strongest local entity signal available and must stay in sameAs');
});

test('the founder personal LinkedIn is never declared as the business identity', () => {
  const sameAs = homeBusiness().sameAs;
  assert.ok(!sameAs.includes(business.social.linkedin),
    'social.linkedin is a Person URL, already declared on the person node; listing it here tells Google one URL identifies both a Person and a GeneralContractor');
  // It must still be on the person, i.e. moved rather than deleted.
  const person = render(pages[1])['@graph'].find(n => n['@type'] === 'Person');
  assert.ok(person.sameAs.includes(business.social.linkedin));
});

test('business sameAs URLs are canonical, not share or tracking links', () => {
  for (const url of homeBusiness().sameAs) {
    assert.ok(!/[?&](mibextid|rdid|share_url|fbclid|utm_)/.test(url),
      `${url} carries a tracking/share parameter; a redirecting URL is a weak sameAs signal`);
    assert.ok(!url.includes('/share/'),
      `${url} is a share redirect rather than the canonical profile URL`);
  }
});
