# MDM → Jira Assets Sync Workflows

**Domain:** Asset management  
**Platforms:** n8n, Jira Assets (REST + AQL), Kandji/Iru API, Microsoft Graph, MaaS360 API  
**Status:** macOS and Windows active; MaaS360 mobile syncs deprecated after MDM consolidation

Three platform-specific n8n workflows share one pattern. Understanding the pattern covers all of them.

## The shared pattern

```mermaid
flowchart TD
    A[Schedule trigger] --> B[Fetch full device inventory from MDM]
    B --> C[Split into records, normalize to a flat schema]
    C --> D[Resolve MDM user email → Jira accountId]
    D --> E[AQL lookup by unique key]
    E -->|match| F[PUT: rewrite all mapped attributes]
    E -->|no match| G[POST: create object with all mapped attributes]
```

| Principle | Implementation |
|-----------|----------------|
| **Idempotent** | A unique-key lookup precedes every write, so re-runs never duplicate |
| **Source-of-truth alignment** | MDM values overwrite asset values on update |
| **Normalization layer** | Nested API responses are flattened to a fixed schema, so attribute mappings survive vendor schema changes |
| **Fault tolerance** | Create and update nodes continue on error; one bad record doesn't stop the run |
| **Non-blocking user mapping** | If no Jira user matches an email, the device is still synced |
| **Explicit mapping** | All attributes are mapped on both create and update |

## Per-platform notes

### macOS: Kandji / Iru

- `GET /api/v1/devices` returns all enrolled devices with nested user, MDM status, and agent status.
- No API-side filtering; validation happens downstream.
- Unique key: **Serial Number**.
- Also maps a User Active Status attribute.

### Windows: Entra ID / Intune

- Microsoft Graph `deviceManagement/managedDevices`, filtered to `operatingSystem eq 'Windows'` at the API level.
- Fields: device name, serial, model, OS version, last sync, user principal name, compliance state, management state, registration state.
- Unique key: **Serial Number**.
- Compliance state is carried into the asset so reporting can query it.

### Mobile: MaaS360 (deprecated)

- XML authentication call returns a token reused for the run.
- Device search, then filter by platform and device type (e.g., iOS + Smartphone, or Tablet).
- Compliance fetched per device from a separate endpoint and mapped into Assets.
- Unique key: **IMEI** for phones, **MDM device UID** for tablets.
- Retired when mobile devices were consolidated into the other two MDMs.

## Operational requirements

- Serial number must stay unique in Assets.
- Assigned User attribute: type User, cardinality 1.
- Date attributes must match the Assets date format.
- Attribute IDs are referenced by the workflow; renumbering requires updating it.
- API credentials (e.g., Graph app permissions) must stay valid and unexpired.

## Limitations / next steps

- No delta sync (full pull each run)
- No retirement logic for devices removed from an MDM
- No change history
- Mobile syncs were consolidated rather than ported
