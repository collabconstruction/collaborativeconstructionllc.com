// The privacy page is a draft until business.json says privacyPublished: true.
// While it is a draft it is not written to _site, not in the sitemap and not linked.
export default {
  eleventyComputed: {
    permalink: (data) => (data.business.privacyPublished ? "/privacy/index.html" : false),
    canonical: (data) => (data.business.privacyPublished ? "/privacy/" : undefined),
  },
};
