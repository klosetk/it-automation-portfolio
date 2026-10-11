# Equipment Return: Manual Trigger Fallback

**Domain:** Employee lifecycle · Offboarding  
**Platforms:** Jira Automation (manual rule), n8n, FedEx APIs, Slack (form), Gmail  
**Status:** Active

Starts an equipment return from ticket fields alone, for when the employee's account is already deactivated. The [standard return workflow](equipment-return-rma.md) looks up that account and its assets, so it fails in that case. This version was added after a display-name user-lookup failure exposed the dependency.

## Trigger

A manual Jira automation button on the ticket sends a webhook to n8n containing the details already stored on it: preferred first name, legal last name, personal email, home address, phone. It never reads the employee's Jira user.

## Flow

| # | Step | Notes |
|---|------|-------|
| 1 | Webhook | Receives the manual trigger |
| 2 | Parse and format address and phone | Regex splits street, city, state, ZIP; flags PO Boxes; fixes run-ons like "Austin TX"; normalizes phone |
| 3 | Completeness branch | Missing fields → Slack error with ticket link; stop |
| 4 | Validate address | Carrier Address Validation API |
| 5 | Create RMA | Payload has return address, employee contact, and an RMA number derived from the ticket key; duplicate RMA → regenerate and retry |
| 6 | Extract RMA details | RMA number, QR value, tracking number |
| 7 | Generate QR image | quickchart.io; failure posts raw carrier response to Slack |
| 8 | **Slack form: manual asset entry** | IT enters model and serial for up to four items plus approver; workflow pauses until submitted |
| 9 | Gmail draft | QR, RMA, instructions, asset list, store locator; CC'd to HR and IT mailboxes |
| 10 | Jira comment | Confirms notification and RMA number |
| 11 | Slack: RMA complete | Approver, date, ticket link, carrier portal link |

## Design notes

**One manual step, on purpose.** Asset entry is the only human input, because that is the data the missing account would have supplied. The workflow pauses on a Slack form instead of failing, which turns a hard dependency into an input.

## Credentials (types only)

Carrier OAuth2 · Slack bot · Gmail OAuth2 (draft creation only) · Jira API token · quickchart.io (no credential).
