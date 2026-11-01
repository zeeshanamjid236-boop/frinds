# The Friends Club

A responsive, static friendship website for GitHub Pages with an optional shared Supabase memory wall.

## Files
- `index.html` — website structure
- `style.css` — responsive design
- `app.js` — friend profiles, search, modal, memories and Supabase connection
- `config.js` — paste your Supabase project URL and publishable/anon key here
- `supabase-schema.sql` — create the cloud memory table and public read/insert policies
- `images/` — upload your group photo here as `group-photo.jpg`

## 1. Set up shared online memory storage
1. Open your Supabase project dashboard.
2. Go to **SQL Editor** → **New query**.
3. Paste all of `supabase-schema.sql` and click **Run**.
4. Go to **Project Settings** → **API** (or API Keys).
5. Copy the **Project URL** and **Publishable key** (or legacy `anon` public key).
6. Open `config.js` and replace the two placeholder values. Keep the quotation marks.
7. Never paste a `service_role` or secret key into this public website.

Example:
```js
window.FRIENDS_CLUB_CONFIG = {
  supabaseUrl: "https://your-project-id.supabase.co",
  supabaseKey: "your-public-publishable-key"
};
```

## 2. Add your group photo
Upload your own image to the repository at `images/group-photo.jpg`.
Keep the exact filename and folder name. The highlighted photo frame on the website will display it.

## 3. Publish on GitHub Pages
1. Open your GitHub repository.
2. Upload all files and folders from this package to the repository root (the same level as `index.html`).
3. Commit the changes to your publishing branch (usually `main`).
4. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
5. Wait for deployment and open the GitHub Pages URL.

If the repository already has an `index.html`, replace it with this package's `index.html` and upload/replace the other matching files too.

## Memory storage behaviour
- Before Supabase is configured, memories are saved only in the current browser as a preview. The page clearly labels this as local preview.
- After Supabase is configured and the SQL script has run successfully, memories are saved in the shared cloud table and visible to visitors.
- This website has no login. Anyone who can access the public website can read and add memories. Do not use it for private information.
- The public policy in the SQL file intentionally allows read and insert only; the website does not provide public delete/edit controls.
- Supabase free-plan quotas and availability still apply.

## Troubleshooting
- **"Invalid API key"**: make sure you copied the Publishable key or legacy anon public key, not a secret/service_role key.
- **"relation does not exist"**: run `supabase-schema.sql` in the correct Supabase project.
- **Permission/RLS error**: check that the SQL script completed and that the anon role has SELECT and INSERT policies.
- **Photo not showing**: confirm the path is exactly `images/group-photo.jpg` (case-sensitive).
- **Old version still showing**: hard refresh the page with `Ctrl + Shift + R`.

The project uses the Supabase JavaScript v2 CDN. Visitors need an internet connection for Google Fonts and cloud memory features.
