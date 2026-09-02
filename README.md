# Odinn W. McLoughlin — Digital Portfolio

Static portfolio site with interactive project demos. No build step, no
frameworks, no trackers — three files (`index.html`, `styles.css`, `demos.js`).
All demos are client-side simulations with canned data: no network calls,
no APIs, no connection to any real system.

`Resume/index.html` is a self-contained, print-ready resume (light theme, Letter
page setup) linked from the nav and the Background section. Use the "Print /
save as PDF" button on that page to export it.

## Run locally

Open `index.html` directly in a browser (everything works from `file://`),
or serve it:

```
py -m http.server 8123
```

## Deploy to GitHub Pages

1. Create a **public** repo (e.g. `odinnmcloughlin.github.io` for the cleanest
   URL, or any repo name).
2. Push this folder's contents to the `main` branch.
3. Repo → Settings → Pages → Source: "Deploy from a branch" → `main` / root.
4. Site goes live at `https://<username>.github.io/` (or `/<repo>/`).

### Security notes (why this setup is safe)

- The site is **static** — GitHub serves flat files; there is no server,
  database, or API to attack.
- Nothing on the site connects to, links to, or mentions any privately
  hosted application, port, or network.
- The public repo contains **only this site** — no project source code.
- Keep 2FA enabled on the GitHub account; that account is the only thing
  that can change the site.
- Before committing any screenshot to `assets/`, follow the sanitization
  checklist in `assets/README.md`.
