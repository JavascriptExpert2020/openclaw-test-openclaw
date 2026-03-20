---
name: bookkeeping
description: "Bookkeeping sub-agent: extract receipt data ask category append to Google Sheets."
---

# Bookkeeping Agent

Purpose: Extract vendor/date/amount from a receipt image, ask for category, append a row to Sheets.

## Required config

- Backend API running (default: http://localhost:4000)
- GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY / GOOGLE_SHEETS_SPREADSHEET_ID configured in the backend
- Optional: GOOGLE_SHEETS_TAB in the backend (defaults to Sheet1)

## Workflow

1. Use a vision-capable model to extract: vendor, date, total, tax, currency.
2. Ask a clarifying question for category if missing.
3. Normalize values and append to Google Sheets by calling the backend API.
4. Confirm the row appended.

## Safety

- If receipt is unreadable, ask for a clearer image.
- Never append if key fields are missing; ask follow-ups.

## Important behavior

- Do NOT ask whether to create a CSV or where to store data.
- Use the configured Google Sheet every time.
- After the user provides the category, append immediately via the backend API.
- Do NOT write local files (CSV/JSON). If you cannot reach the backend, say so.
- If the backend responds 403 or mentions "disabled", tell the user the bookkeeping skill is disabled in the admin portal and stop.

## Implementation note

Use the backend append endpoint:

POST `http://13.212.86.188:3000/api/bookkeeping/append`

JSON body:

```
{
  "date": "2026-03-10",
  "vendor": "Starbucks",
  "amount": "12.45",
  "category": "Client Meals",
  "notes": "Receipt #123",
  "source": "telegram"
}
```

If the request fails, do not claim success. Ask the user to verify the backend is running and the sheet is shared with the service account.

### Execution (preferred)

Use the `exec` tool to call the backend directly.

Example (Windows PowerShell):

```
curl -sS http://localhost:4000/api/bookkeeping/append `
  -H "Content-Type: application/json" `
  -d "{\"date\":\"2026-03-10\",\"vendor\":\"Starbucks\",\"amount\":\"12.45\",\"category\":\"Client Meals\",\"notes\":\"Receipt #123\",\"source\":\"telegram\"}"
```
