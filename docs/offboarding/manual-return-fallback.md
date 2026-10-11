# QR Code Generator: Manual Trigger Fallback

**Domain:** Employee lifecycle · Offboarding  
**Platforms:** Jira Automation (manual rule), n8n, FedEx APIs, Slack (form), Gmail  
**Status:** Active

The standard return workflow depends on looking up the employee's Jira account and assets. If that account has already been deactivated, the lookup fails. This version works from ticket fields alone, so a return can always be started.

## When to use it

Use when the automated workflow can't run, most commonly because the employee's directory account is gone. It was added after a user-lookup failure on display-name search exposed the dependency.

## Trigger

A manual Jira automation button on the ticket sends a webhook to n8n containing the details already stored on it: preferred first name, legal last name, personal email, home address, phone. It never reads the employee's Jira user.

## Flow

| # | Step | Notes |
|---|------|-------|
| 1 | Webhook | Receives the manual trigger |
| 2 | Parse address and phone | Regex patterns split street, city, state, ZIP; flags PO Boxes |
| 3 | Format address fields | Fixes run-ons like "Austin TX"; normalizes phone; checks completeness |
| 4 | Completeness branch | Missing fields → Slack error with ticket link; stop |
| 5 | Validate address | Carrier Address Validation API |
| 6 | Build RMA payload | Return address, employee contact, RMA number derived from ticket key |
| 7 | Create RMA | Duplicate RMA → regenerate and retry |
| 8 | Extract RMA details | RMA number, QR value, tracking number |
| 9 | Generate QR image | quickchart.io; failure posts raw carrier response to Slack |
| 10 | **Slack form: manual asset entry** | IT enters model and serial for up to four items plus approver; workflow pauses until submitted |
| 11 | Gmail draft | QR, RMA, instructions, asset list, store locator; CC'd to HR and IT mailboxes |
| 12 | Jira comment | Confirms notification and RMA number |
| 13 | Slack: RMA complete | Approver, date, ticket link, carrier portal link |

## Design notes

- **One manual step, on purpose.** Asset entry is the only human input, because that's the data the missing account would have supplied. Everything else still runs automatically.
- **Pause with a form.** The workflow waits on a Slack form instead of failing, then resumes. This turns a hard dependency into an input.
- **Error paths always say where to look.** Every failure posts to Slack with a ticket link or the raw response.

## Credentials (types only)

Carrier OAuth2 · Slack bot · Gmail OAuth2 (draft creation only) · Jira API token · quickchart.io (no credential).
