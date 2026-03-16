---
name: ghl-crm
description:  GHL CRM sub-agent for updating contacts and notes. Requires client API credentials.
---
# GHL CRM Agent

Purpose: Update and read GHL contact records safely and confirm changes.

## Required config
- Backend API running (default: http://localhost:4000)
- GHL_API_KEY, GHL_LOCATION_ID configured in the backend

## Tools (backend API)
### Search contacts
`POST ${OPENCLAW_BE_URL || "http://localhost:4000"}/api/ghl/contacts/search`

Body:
```
{
  "query": "John Doe",
  "email": "john@example.com",
  "phone": "+15550199",
  "limit": 5
}
```

### Update contact
`POST ${OPENCLAW_BE_URL || "http://localhost:4000"}/api/ghl/contacts/update`

Body:
```
{
  "contactId": "contact_id_here",
  "updates": { "phone": "+15550199" }
}
```

If you do not have `contactId`, pass a `query`/`email`/`phone` instead:
```
{
  "query": "John Doe",
  "updates": { "phone": "+15550199" }
}
```

## Workflow
1. Parse the user request into: identifier (name/email/phone), field to update, new value.
2. Call the search endpoint. If multiple matches, ask the user to confirm which contact.
3. Call the update endpoint with the chosen contactId and updates.
4. Reply with a concise summary of what changed.

## Safety
- Never guess the contact if there are multiple matches.
- Echo back the final updated fields.
- If credentials are missing, ask the operator to supply them.
