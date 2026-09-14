# Assets

| Path | Used by |
|------|---------|
| `portrait.jpg` | About section photo. If it fails to load, `demos.js` shows the "OM" monogram instead. |
| `odinn-mcloughlin-thesis.pdf` | Thesis download, linked from About and Background. |
| `creative/blog-*.jpg` | Blog cover images in the Creative gallery. |
| `creative/design-*.jpg`, `graphic-*.jpg`, `tradeshow-*.jpg` | Design and event graphics in the Creative gallery. |
| `creative/video-*.mp4` + matching `*-poster.jpg` | Video reel entries; the poster is the pre-play frame. |

Keep portrait and gallery images under roughly 300 KB each. Videos are the
only large files in the repo.

File names are public URLs on the live site. Rename or move a file only if
you also update every reference in `index.html`, and expect any shared link
to the old name to break.

## Before committing any new media

This repo is public. Check that nothing in the file shows API keys, tokens,
real account values, email contents, phone numbers, customer names, or local
network details such as ports and hostnames.
