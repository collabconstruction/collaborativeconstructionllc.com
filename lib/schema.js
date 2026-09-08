/**
 * JSON-LD generation.
 *
 * Replaces four hand-maintained <script type="application/ld+json"> blocks that
 * had already started to drift. Every value is derived from src/_data, so the
 * structured data cannot disagree with the rendered page or with the Google
 * Business Profile.
 *
 * Governing rule: NEVER emit a claim that is not also visible in page copy and
 * confirmed by the owner. Unknown facts are `null` in business.json and are
 * dropped by `prune()` rather than guessed. A missing property costs nothing;
 * a fabricated licence number or street address is a real-world liability.
 */

const SITE = "https://collaborativeconstructionllc.com";

const id = (fragment) => ({ "@id": `${SITE}${fragment}` });

/** Recursively drop null/undefined/empty values so absent facts emit nothing. */
function prune(value) {
  if (Array.isArray(value)) {
    const cleaned = value.map(prune).filter((v) => v !== undefined);
    return cleaned.length ? cleaned : undefined;
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith("_")) continue; // documentation keys in the data files
      const pruned = prune(v);
      if (pruned !== undefined) out[k] = pruned;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (value === null || value === "" || value === undefined) return undefined;
  return value;
}

function postalAddress(address) {
  return {
    "@type": "PostalAddress",
    streetAddress: address.street,
    addressLocality: address.locality,
    addressRegion: address.region,
    postalCode: address.postalCode,
    addressCountry: address.country,
  };
}

/** The business node. Every other page references it by @id rather than repeating it. */
function businessNode(business, people) {
  return {
    "@type": ["GeneralContractor", "HomeAndConstructionBusiness"],
    ...id("/#business"),
    name: business.name,
    legalName: business.legalName,
    url: `${SITE}/`,
    image: `${SITE}${business.images.share}`,
    logo: `${SITE}${business.images.logo}`,
    email: business.email,
    telephone: business.phoneSchema,
    slogan: business.tagline,
    description: business.description,
    foundingDate: business.founded,
    openingHours: business.hours,
    address: postalAddress(business.address),
    areaServed: business.areaServed.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
    founder: id(`/about#${people.wesleigh.id}`),
    sameAs: Object.values(business.social),
  };
}

function personNode(business, people) {
  const p = people.wesleigh;
  return {
    "@type": "Person",
    ...id(`/about#${p.id}`),
    name: p.name,
    jobTitle: p.jobTitle,
    image: `${SITE}${p.photo}`,
    url: `${SITE}/about`,
    description: p.description,
    worksFor: id("/#business"),
    knowsAbout: p.knowsAbout,
    alumniOf: p.alumniOf.map((name) => ({
      "@type": "CollegeOrUniversity",
      name,
    })),
    // The credential claim itself is stated in visible page copy and confirmed
    // by the owner, so it is emitted. Only `identifier` waits on the actual
    // licence number: an unknown number is an absent property, not a reason to
    // drop a true and verifiable E-E-A-T signal.
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "license",
      name: "Massachusetts Construction Supervisor License (CSL)",
      identifier: business.cslNumber,
      recognizedBy: {
        "@type": "GovernmentOrganization",
        name: "Commonwealth of Massachusetts",
      },
    },
    sameAs: p.sameAs,
  };
}

function serviceNode(business, service) {
  return {
    "@type": "Service",
    ...id(`/construction-advisory#${service.slug}`),
    name: service.title,
    serviceType: service.title,
    description: service.summary,
    provider: id("/#business"),
    areaServed: business.areaServed.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
  };
}

function breadcrumbNode(url, title) {
  const items = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
  ];
  if (url !== "/") {
    items.push({ "@type": "ListItem", position: 2, name: title });
  }
  return {
    "@type": "BreadcrumbList",
    ...id(`${url}#breadcrumb`),
    itemListElement: items,
  };
}

/**
 * Nunjucks filter: {{ page-ish-context | jsonld }}
 *
 * Expects an object with { url, title, schemaType, business, people, services }.
 * `schemaType` comes from page front matter and selects which extra nodes join
 * the shared business node in the @graph.
 */
function jsonld(ctx) {
  const { url, title, schemaType, business, people, services = [] } = ctx;
  // The <title> carries a brand suffix for the SERP. Structured data reads
  // better with a plain human label, so pages may override it.
  const pageName = ctx.schemaName || title;
  const crumbName = ctx.breadcrumbName || pageName;
  const graph = [];
  const pageId = id(`${url}#webpage`);

  if (url === "/") {
    graph.push(businessNode(business, people));
    graph.push({
      "@type": "WebSite",
      ...id("/#website"),
      url: `${SITE}/`,
      name: business.name,
      publisher: id("/#business"),
    });
    graph.push({
      "@type": "WebPage",
      ...pageId,
      url: `${SITE}/`,
      name: business.name,
      isPartOf: id("/#website"),
      about: id("/#business"),
    });
  } else {
    const pageType =
      schemaType === "about"
        ? "AboutPage"
        : schemaType === "gallery"
          ? "CollectionPage"
          : "WebPage";

    if (schemaType === "about") {
      graph.push(personNode(business, people));
    }
    if (schemaType === "services") {
      for (const s of services) graph.push(serviceNode(business, s));
    }

    graph.push(
      prune({
        "@type": pageType,
        ...pageId,
        url: `${SITE}${url}`,
        name: pageName,
        isPartOf: id("/#website"),
        about: schemaType === "gallery" ? id("/#business") : undefined,
        mainEntity:
          schemaType === "about" ? id(`/about#${people.wesleigh.id}`) : undefined,
        breadcrumb: id(`${url}#breadcrumb`),
      })
    );
    graph.push(breadcrumbNode(url, crumbName));
  }

  return JSON.stringify(
    { "@context": "https://schema.org", "@graph": graph.map(prune).filter(Boolean) },
    null,
    2
  );
}

module.exports = { jsonld, prune, SITE };
