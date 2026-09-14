# Odinn W. McLoughlin — Digital Portfolio

Static portfolio site with interactive project demos, live at
<https://odinn-alt.github.io/>. No build step, no frameworks, no trackers.
All demos are client-side simulations with canned data: no network calls,
no APIs, no connection to any real system.

The site is unlisted: `index.html` carries a `noindex` robots tag, so it is
reachable by direct link but not meant to appear in search results.

## Layout

```
index.html      page structure and copy
styles.css      all styling
demos.js        interactive demos and small page behaviours
assets/         portrait, thesis PDF, creative gallery media (see assets/README.md)
.nojekyll       tells GitHub Pages to serve files as-is
```

## Run locally

Open `index.html` directly in a browser (everything works from `file://`),
or serve it:

```
py -m http.server 8123
```

## Deployment

GitHub Pages serves the `main` branch from the repo root. Pushing to `main`
publishes the change within a minute or two; there is nothing else to run.

## Security notes

- The site is static. GitHub serves flat files; there is no server, database,
  or API to attack.
- Nothing on the site connects to, links to, or mentions any privately hosted
  application, port, or network.
- The public repo contains only this site, never project source code.
- Keep 2FA enabled on the GitHub account; that account is the only thing that
  can change the site.
- Before committing new media to `assets/`, follow the checklist in
  `assets/README.md`.
