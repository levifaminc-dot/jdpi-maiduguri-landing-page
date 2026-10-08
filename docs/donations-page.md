# Donation page

Local design: a report-photo introduction, compact giving panel, programme examples, report/impact links, other ways to support and donor FAQs. Inspiration: [IRC](https://help.rescue.org/donate), [WaterAid](https://us.wateraid.org/campaign/749999/donate?c_src=27-ack-web-dru-bau) and [UNICEF USA](https://www.unicefusa.org/how-help/ways-give). Their appeals, financial percentages, tax status, donation-price examples and matching offers are not copied onto JDPI's page.

## Activate JDPI's links

Populate `config/donations.json` with organisation-approved URLs, or use the matching public build variables in `.env.example` / Vercel. Environment variables take priority. Each provider has independent one-time and recurring links. Recurring giving stays pending without its own approved URL. The existing Sanity `donationUrl` is preserved: recognised provider links serve one-time giving; other valid HTTPS links remain an additional checkout option. No CMS schema, content or credentials are changed.

Configured Paystack and Flutterwave links must use HTTPS on the respective provider domain (or its subdomain), without credentials or non-standard ports. Invalid configuration stops the build. This checks URL structure, not merchant ownership: JDPI must verify the recipient/account, live mode, amount rules, currency, payment methods, recurring schedule, fees and cancellation/refund arrangements before supplying links. No provider accounts or subscriptions are created by this website.

The panel never collects card, bank or donor identity details. Amount, currency and payment methods are reviewed on provider-hosted checkout; the page does not pretend to prefill an amount. Blank links show “Awaiting activation” and a working donation-enquiry email action. Bank-transfer details must be requested from JDPI; no account is fabricated. FAQs use native details/summary and giving choices use native radio groups. Without JavaScript, explicit per-provider links/pending notices remain available.

Provider documentation: [Paystack Payment Pages](https://support.paystack.com/en/articles/2132546), [Flutterwave payment/donation links](https://flutterwave.com/us/blog/useflutterwave-payment-links-to-collect-payments-easily-and-securely).

## Verification and launch

`npm run verify` checks pending/active choices for both providers and both frequencies, separate recurring links, legacy fallback, malicious/wrong-provider URLs, content, types, output routes and local assets. Unit-test checkout strings are never visited and no payments are made. Browser QA covers desktop/mobile pending choices and FAQs. Actual checkout completion and receipt/cancellation behaviour must be verified by JDPI after its links are approved. No completed donation is claimed by this page.

Local QA: all 35 built pages and type checks passed. Paystack/Flutterwave and give-once/monthly selections updated the enquiry destination and announced the correct pending state. Native radio arrow-key navigation and FAQ expansion worked. Desktop at 1280px and narrow layouts at 390px/320px showed no horizontal overflow; both report photographs loaded. Checkout links remain unconfigured pending JDPI approval.
