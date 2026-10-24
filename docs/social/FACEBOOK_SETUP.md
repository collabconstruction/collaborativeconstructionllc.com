# Facebook setup, October 16, 2026

Page supplied by owner: https://www.facebook.com/profile.php?id=61593017512930
Page ID: 61593017512930. API connectivity and ownership permissions are not yet verified.

## Page presentation

Suggested bio: Residential construction, additions, renovations and independent project oversight. Contact us to discuss your project.

Use the approved CC monogram as profile image. Use the separate architectural cover artwork as illustration, not as a completed-project photograph. Add a Contact Us action pointing to https://collaborativeconstructionllc.com/#contact when the public website is ready to receive visitors. Until then, use an available phone/contact action.

Owner supplied phone: +1 508-440-6981. Facebook email is wes@collaborativeconstructionllc.com; website currently uses collaborativeconstructiongc@gmail.com. Owner must confirm whether the domain mailbox receives messages and which address should be public before either is changed. Address spelling should also be reconciled with the approved business record. Confirm hours and service area.

## Owner steps for connection

1. Sign into Facebook yourself and check Page access for the supplied Page. Confirm you control the business Page.
2. Sign into Meta for Developers and create or select a business-owned app for Page management. Complete any Meta registration, verification or agreements personally.
3. Share the non-secret app ID and Page URL/ID only. Do not send passwords, app secrets, login codes or access tokens to chat.
4. The developer then configures a private OAuth callback, permission requests and secure server-side token storage. The existing website has no Facebook OAuth callback or publishing service yet. Do not enter a guessed callback URL.
5. Owner authorizes the requested account access in Meta. Initial target permissions: pages_show_list, pages_read_engagement and pages_manage_posts. Request read_insights only if analytics is required and available. Confirm actual prerequisites, review requirements and current API version against Meta documentation during implementation.
6. Verify the connected Page ID with a read-only API call before publishing. Configure token-expiry handling, audit logs and duplicate-post prevention. Keep all tokens server-side, outside Git and public assets. Owner enters secrets directly through the approved secret manager.
7. First release uses a review queue: select approved photo, draft caption, review, then publish the approved post. No automatic ads, messaging or comment moderation.

## Monthly review

Codex heartbeat monthly-construction-social-review was created in this chat for the first of each month at 09:00 Eastern. It prepares useful project/news drafts for review; it does not itself connect Meta or publish posts. This is a Codex app automation, not a deployed Cloudflare or Claude scheduler.

## Suggested first post

A closer look at the New Seabury deck, including the railing details, steps and evening lighting.

Planning a deck or exterior renovation? Contact Collaborative Construction to discuss your project.

Use the supplied project photos only after confirming the company's role and permission for public posting. Avoid claiming sole construction authorship until confirmed.
