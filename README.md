# FOMO Workers Webapp

A simple, mobile-first photo upload web app for FOMO Energy field workers across Singapore. Workers capture site photos on their phones and upload them to a SharePoint folder, auto-organized by project, category, and uploader.

**Live app:** 
- Firebase: <https://fomo-photo-upload.web.app/>
- GitHub Pages: <https://juliustanch.github.io/fomo-photo-upload/>

---

## What it does

1. Worker opens the app on their phone (as a home-screen shortcut)
2. Types their name (saved automatically for next time)
3. Picks a project (or types a new one — recent ones appear as chips)
4. Picks a category — Site survey / Installation / Completion / Maintenance / Purchase receipt
5. Snaps or selects photos (5–20 at a time)
6. Optionally adds a note
7. Hits **Send update** → photos land in SharePoint, organized by project and category

No logins, no app install, no paperwork.

---

## Tech stack

Plain HTML + React (via Babel-in-browser, no build step) + vanilla CSS. Hosts statically on Firebase and GitHub Pages. Server-side logic lives entirely in a **Power Automate flow** that receives the uploads and writes them to SharePoint.

- **Frontend:** `index.html` + `app.jsx` + `tweaks.jsx` + `ios-frame.jsx` + `fomo-logo.png`
- **Hosting:** Firebase + GitHub Pages
- **Backend:** Power Automate HTTP trigger → SharePoint "Create file" action
- **Storage:** SharePoint document library (`Fomo Site Uploads`)

---

## File structure

```
├── index.html              # Entry point (GitHub Pages serves this by default)
├── app.jsx                 # Main React component — all app logic lives here
├── tweaks.jsx              # Floating theme-toggle panel (design-time only)
├── ios-frame.jsx           # iPhone bezel wrapper for preview/mockups
├── fomo-logo.png           # Brand logo (white, shown on dark header)
└── README.md               # You are here
```

> **Note:** The deployed filename must be `index.html` for GitHub Pages to serve it at the repo root. Rename `Fomo Workers Upload.html` to `index.html` when deploying.

---

## Upload flow

```
Worker's phone
      │
      │  1. User fills form, taps Send
      ▼
[Client-side compression + sequential upload]
      │
      │  2. One HTTP POST per photo (with JSON payload)
      ▼
Power Automate HTTP trigger
      │
      │  3. Apply to each photo → Create file
      ▼
SharePoint: /Fomo Site Uploads/<Project>/<Category>/
      │
      │  Files named: YYYY-MM-DD_HHMM_<Uploader>_NN.jpg
      ▼
Ops team reviews photos, clustered by project + category
```

### Payload format

Each HTTP POST sent to Power Automate looks like:

```json
{
  "project": "Project Frontier",
  "uploader": "Ahmad",
  "category": "Installation",
  "timestamp": "2026-04-18T14:30:00.000Z",
  "note": "Rooftop panels aligned and sealed",
  "photos": [
    { "name": "2026-04-18_1430_Ahmad_01.jpg", "data": "<base64>" }
  ]
}
```

Photos are sent **one at a time** (not batched) to avoid Power Automate's body-size limit and mobile network timeouts.

### Note files

If the user types anything in the note field, it's also sent as a separate `.txt` file containing a header (project, uploader, category, timestamp) and the note body. Same folder as the photos.

---

## Local development

No build step, no npm, no dependencies to install. Just:

```bash
# Clone the repo
git clone https://github.com/juliustanch/fomo-workers.git
cd fomo-workers

# Serve locally (pick one)
python3 -m http.server 8000
# or
npx serve .

# Open http://localhost:8000
```

Edit `app.jsx` or `Fomo Workers Upload.html` in any editor, then refresh your browser.

> **Important:** Must serve from HTTP, not file://. Babel-in-browser needs a proper origin.

---

## Deployment (GitHub Pages)

1. Push changes to the `main` branch
2. GitHub Pages auto-deploys within ~1 minute
3. Users may need to hard-refresh (or append `?v=N` to the URL) to bust the browser cache

To verify deployment: go to **Settings → Pages** in your repo. The URL should be `https://juliustanch.github.io/fomo-workers/`.

---

## Power Automate flow

The flow's HTTP trigger URL is hardcoded into `app.jsx` as `FLOW_URL` (inside the `submit()` function). If the flow URL ever rotates, update that constant.

### Flow structure

- **Trigger:** "When an HTTP request is received" (manual)
- **Action:** "Apply to each" over `triggerBody()?.photos`
  - **Inside:** "Create file" to SharePoint
    - Site Address: `https://fomoenergy.sharepoint.com/sites/FomoEnergy`
    - Folder Path:
      ```
      concat('/Fomo Site Uploads/', triggerBody()?['project'], '/', triggerBody()?['category'])
      ```
    - File Name:
      ```
      items('Apply_to_each')?['name']
      ```
    - File Content:
      ```
      base64ToBinary(items('Apply_to_each')?['data'])
      ```
- **Response:** `{ "status": "ok" }` with HTTP 200

---

## Customization

### Change categories

Edit the `CATEGORIES` array at the top of `app.jsx`. Categories listed in `NO_PROJECT_CATEGORIES` skip the project field (e.g. `receipt`).

### Change branding

The FOMO brand theme is defined inside the `THEMES` object in `app.jsx` (the `fomo` key). Colors follow the brand guide: Deep Navy `#0D1B35`, FOMO Orange `#FF7F41`, Slate Blue `#5B78A0`, Caption Grey `#8899AA`.

To switch default theme, edit `TWEAK_DEFAULTS.themeKey` in `Fomo Workers Upload.html`.

### Change the headline

Search `app.jsx` for `Upload photos to Ops Team`.

---

## What's stored locally (per device)

The app uses `localStorage` (never cookies) for:

- `fomo_user_name` — the worker's name (pre-filled on return visits)
- `fomo_recent_projects` — last 5 unique project names, used as suggestion chips

This is per-device and per-browser. Clearing browser data or switching phones resets the suggestions.

---

## Mobile installation (for workers)

Tell your workers:

**iPhone (Safari):**
1. Open the app URL
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Name it "FOMO Upload" → Add

**Android (Chrome):**
1. Open the app URL
2. Tap ⋮ menu
3. Tap "Add to Home screen"
4. Name it "FOMO Upload" → Add

The app now looks and feels like a native app — fullscreen, no browser chrome.

---

## Performance

Each photo is compressed client-side (JPEG, max 1600px, quality 0.8) before upload. Typical 8MB iPhone photo → ~500KB, ~10× faster over 4G. Uploads happen sequentially to avoid timeouts; expect ~3–5 seconds per photo on a decent connection.

A progress counter shows **"Uploading 3 of 12…"** while the batch runs.

---

## License

Internal FOMO Energy project. Not for external distribution.

