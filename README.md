# Hamstra Roofing — Town Landing Pages

Best-practice, town-specific landing pages for Hamstra Roofing's **New Territory
Expansion** into the western Chicago suburbs (Downers Grove, Hinsdale, Elmhurst, etc.).
Each page is a single self-contained HTML file flavored for one town, designed to rank
in Google and AI search for "roofer near me" and to convert via a free-inspection lead form.

## Live page

- `landing-pages/downers-grove.html` — Downers Grove, IL (intended for `downersgrove.hamstraroofing.com`)

### Password
The page is gated with a **client-side** password prompt (`iloveroofing`).
> ⚠️ This is a soft gate for sharing a private preview — it is **not** real security.
> The HTML is readable in source. For true protection, serve it behind HTTP auth
> or a host-level access control.

## Media (hosted on Cloudinary)

Images and the hero video are delivered from Cloudinary (`f_auto,q_auto`) for automatic
WebP/AVIF and adaptive quality. Source files live in `landing-pages/img/*.webp` and
`landing-pages/video/hero.mp4`.

To (re)upload assets:

```bash
CLOUDINARY_API_SECRET="<secret>" landing-pages/upload-to-cloudinary.sh
```

Public IDs are under `hamstra/downers-grove/*` (cloud name `dsbllwpbh`).

## Notes

- Branding: Barlow Condensed / Barlow, red `#EB1A2C`, official Hamstra wordmark (inline SVG).
- Project photos and resident reviews on the page are **AI-generated representative samples**
  for demonstration — replace with verified Downers Grove photos and collected Google reviews
  before publishing.
