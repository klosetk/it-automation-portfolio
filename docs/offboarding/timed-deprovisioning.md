# Timed Deprovisioning with Human Approval

**Domain:** Employee lifecycle · Offboarding  
**Platforms:** Jira Automation, n8n, Google Workspace Admin, Google Calendar, Slack  
**Status:** Active

Removes Google Workspace access at the exact separation time, but only after a human has confirmed twice. The one irreversible action in the chain is always behind a checkpoint.

## Flow

```mermaid
flowchart TD
    A[Jira scheduled rule, every 7 min] -->|status = Waiting for Termination Date AND date = today AND type = NORMAL| B[Webhook to n8n]
    B --> C[Wait 30s, transition ticket to In Progress]
    B --> D[Validate payload, parse timezone]
    D --> E[Create IT calendar reminder at separation time]
    E --> F{Type}
    F -- NORMAL --> G[Wait until exact separation time]
    F -- IMMEDIATE --> H[Skip wait]
    G --> I[Look up user in Google Admin]
    H --> I
    I -->|not found| J[Fallback: Jira search by last name]
    J -->|still not found| K[Slack alert, stop]
    I -->|found| L[Update manager field]
    L --> M[Fetch group memberships via directory lookup service]
    M --> N[Slack approval request: double approval]
    N -->|approved| O[Post groups to Jira as audit comment]
    N -->|approved| P[Move user to /Deprovision OU]
    P --> Q{User in OU?}
    Q -- Yes --> R[Comment, update status, Slack confirmation]
    Q -- No --> S[Comment asking for manual verification]
```

## Key behaviors

| Behavior | Why |
|----------|-----|
| **Polling every 7 minutes** with a JQL filter on separation date or last working day | Catches the right day without per-ticket schedules |
| **Payload validation** (separation time and issue key required; fails loudly if missing) | Bad data should stop the run, not silently skip it |
| **Timezone parsing** from free-text values like `Pacific Time (GMT-7)` | Calendar entries and wait times land at the correct local moment |
| **Calendar event** for IT at separation time | Visibility even if a Slack message is missed |
| **Wait node** held until the exact separation instant (UTC) | Access is removed at the right minute, not "sometime that day" |
| **Two-step lookup** (Google Admin, then Jira by last name, real accounts only) | Survives username mismatches |
| **Manager field update** before removal | Keeps the org chart accurate in the directory after departure |
| **Group snapshot** posted to the ticket | Audit trail of access held at the moment of removal |
| **Double approval in Slack**, with a warning that this removes all Workspace access and locks devices | Human checkpoint before the irreversible step |
| **Post-action verification** of OU placement | Never assumes the action worked |

## Safety properties

- No account found in either system → alert and **stop**; nothing is guessed.
- Irreversible action only after both approvals.
- Every state change leaves a Jira comment.

## Related

- Group snapshot comes from the [Directory Lookup Service](../infrastructure/directory-lookup-service.md).
- Device recovery continues in [Equipment Return](equipment-return-rma.md).
