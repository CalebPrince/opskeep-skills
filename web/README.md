# Opskeep Skills — landing page

A static landing page for the repo: install instructions, the full skill directory
(filterable by lane), supported agent runtimes, and the MCP server quick-start.

No build step — plain `index.html` / `style.css` / `script.js`.

## Run it locally

```bash
cd web
python -m http.server 4173
# then open http://localhost:4173
```

Any static file server works equally well (`npx serve`, etc.).

## Deploy to Vercel

From the repo root:

```bash
npx vercel --cwd web
```

Or in the Vercel dashboard: import the `opskeep-skills` repo, then set **Root Directory**
to `web` and **Framework Preset** to **Other** (no build command, no output directory
override needed — it serves the static files as-is).

## Logo

`logo-mark.svg` (the asterisk alone, for favicons/avatars) and `logo-lockup.svg` (mark +
wordmark + tagline) are plain vector files with system-serif/sans fallback fonts, so they
render correctly anywhere (GitHub, Slack, image viewers) without needing the page's
Google Fonts.

The "Works with" and hero-diagram sections use each tool's own logo (Claude, OpenAI,
Cursor, Cline) to show real compatibility, sourced from [Simple Icons](https://simpleicons.org)
(CC0). Those marks are trademarks of their respective owners; used here only to indicate
support, not endorsement.
