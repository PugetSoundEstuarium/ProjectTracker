# ImpactFlow Operations Hub. Google Sheets + Apps Script Version

This package turns the tracker into a shared web app backed by one Google Sheet.

## What it does
- Shared team-member dropdown in the header
- Projects with free-entry titles
- Tasks with due dates
- Updates, announcements, and decisions
- One central dataset in Google Sheets
- Web app deployment for staff use from one URL

## Files
- `Code.gs` = server-side Apps Script
- `Index.html` = user interface
- `appsscript.json` = project settings

## Setup
1. Create a new Google Sheet in Drive.
2. Open **Extensions > Apps Script**.
3. Delete the default `Code.gs`.
4. Paste in the contents of `Code.gs` from this package.
5. Create a new HTML file named `Index` and paste in `Index.html`.
6. Replace `appsscript.json` in Project Settings if needed.
7. Save the project.
8. Run `setupWorkbook()` once from Apps Script.
9. Optional: run `seedSampleData()` once to load sample records.

## Deploy
1. Click **Deploy > New deployment**.
2. Choose **Web app**.
3. Execute as: **Me**.
4. Who has access: choose the option that matches your staff access needs.
5. Deploy and use the generated URL.

## Important
Running the HTML file directly from Google Drive does **not** create shared live sync by itself.
The shared version requires Apps Script deployment so everyone hits the same web app URL and the same Google Sheet.

## Recommended tabs created automatically
- Team
- Projects
- Tasks
- Updates

## Notes
- Project title is free-entry.
- Linking a task or update to a saved project is optional.
- Tasks, updates, and decisions all stay in the same system.
