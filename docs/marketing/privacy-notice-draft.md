# Privacy notice (draft, not published)

Draft only. The site has no privacy page today. Plain wording, not legal advice. The owner approves it and a lawyer should review it before it goes live. Nothing here is on the website.

Updated October 21, 2026 after an independent review found the first draft said too much ("nothing is sent"). Cloudflare also runs its own analytics and security, so the wording below is narrower.

## What the code and settings do (checked in the repo)

- **Google Analytics:** loads only after a visitor chooses Accept. Decline stops Google Analytics. Ad storage, ad data sharing, ad personalisation and Google signals are off. After Accept it sends the page name, the campaign tags in the link (utm_source, utm_medium, utm_campaign), the referring site's name only, and four actions: phone tap, email tap, first click into the contact form, form send.
- **Cloudflare Web Analytics:** switched on at the edge by Cloudflare's automatic setup (see `src/_data/analytics.json`). The repo describes it as cookieless. It runs for everyone, with or without the banner. Not re-checked in the dashboard.
- **Cloudflare security:** the site runs on Cloudflare, which handles traffic, bot protection and the Turnstile check on the contact form. Turnstile receives the visitor's IP address to judge whether a submission is a bot. The same IP address is used to limit repeated submissions. The IP address is not a column in the inquiry database.
- **Contact form:** the database stores name, email, phone, message, the page the visitor came from, the referring site, campaign tags, country, browser user agent and an optional Google Analytics client id. It also stores a project type, town, budget range and timeline if given.
- **Uploads:** photos and plans are kept in private Cloudflare storage. They are not public.
- **Email:** each inquiry is emailed to the company inbox. A copy stays in that mailbox.
- **Cookies:** the consent choice is saved in the browser's local storage. Google Analytics may set cookies after Accept.

## Draft text

**How we use analytics**

If you choose Accept, we use Google Analytics to learn how people find and use this website. We share with Google Analytics which pages you view, which website sent you to us (the site name only), any campaign tag in the link you used, and whether you tapped our phone number or email, started the contact form or sent it. We do not share what you type into the form, and we do not use this data for advertising.

If you choose Decline, Google Analytics does not run. We also use Cloudflare Web Analytics, a privacy focused service that counts visits without cookies. It runs whether you accept or decline.

You can change your choice by clearing this site's data in your browser. The notice will appear again.

**Security**

Our website runs on Cloudflare. Cloudflare protects the site from abuse and uses a Turnstile check on the contact form. To do this, Cloudflare processes your IP address.

**Contact form and uploads**

When you send an inquiry, we receive your name, email, phone number (if you give one), message, project details and any photos or plans you attach. We use them to answer your inquiry and to plan your project. They are stored in our private inquiry system and emailed to our company inbox. We do not sell them.

[Retention: owner to confirm. See `data-inventory.md`. Do not publish a number until the process exists.]

**Asking us to delete your information**

Email collaborativeconstructiongc@gmail.com or call (508) 440-6981 and tell us what you want removed. We will confirm what we hold and what we can remove. [Owner to confirm the process and the time we will take. We may need to keep some records.]

**Contact**

Collaborative Construction, LLC, 16 Terry Lou Ave, East Falmouth, MA 02536.

## Questions for the owner

1. Should this be a page at /privacy/ with a footer link? That is a site change and a deploy.
2. Which retention periods do you want? See the proposal in `data-inventory.md`.
3. Who reviews the wording?
