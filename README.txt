VEGAS STUDIO WEBSITE SOURCE
Latest published design: 26 November 2026
Live site: https://vegas-studio-brand-preview.vercel.app/
Deployment: dpl_5nMJ9WLt2mRoU4EKqbsQ3G1cAkYQ

This is the editable static HTML, CSS and JavaScript source for the published
49-page website, including all 19 game pages and their required artwork.
There is no build step or npm dependency installation.

RUN LOCALLY
1. Extract this entire ZIP into a folder.
2. Open a terminal in that folder.
3. Run: python -m http.server 8765
4. Open: http://localhost:8765/index.html
Use a local server: opening index.html directly will break root-relative assets.
Production redirects and clean URLs are handled by Vercel's vercel.json;
for the simple Python server, use the .html page filenames directly.

EDIT THE WEBSITE
index.html                 Homepage
games.html                 Full catalogue
game-*.html                Game detail pages
players.html               Players Hub
launch-layout.css          Base layout
launch.css / launch.js     Shared UI, navigation, age notice and filters
game-showcase.css / .js    Game selection, transitions and playback controls
premium.css / premium.js  Design, four-corner hover traces, tabs and image viewer
assets/                    Logos, artwork and other required assets
vercel.json                Clean URLs, redirects and rewrites
SOURCE-MANIFEST.json       SHA-256 hashes of the packaged website files

DEPLOY TO VERCEL
Deploy the extracted folder as a static site (framework preset: Other).
No build command is required; the output directory is the project root.
With the Vercel CLI: vercel deploy --prod
Choose the intended project/account when prompted. No account credentials or
private environment files are included in this archive.

FUNCTIONAL SCOPE
Game filters, previews, tabs, mobile menus, age notice and image enlargement
run in the browser. Live statistics are clearly labelled dated snapshots.
Accounts, demos, trailers, business enquiries and authoritative legal policies
continue through the linked official services. Backend/API source is not part
of this static website and was not supplied for this project.

BRAND
Ruby Corporate with the approved Flat Star & Palm logo.
Keep the logo proportional, with white VEGAS and hot pink STUDIO on plum.
No black company-name lettering, black brand backgrounds or green logo boxes.

QA COMPLETED
49 pages checked at 320px and 1440px for layout overflow.
Internal links and required assets checked.
Catalogue filtering/search, reset, keyboard tabs, mobile navigation and
screenshot viewer tested. Published route redirects and catalogue verified.
Four clockwise corner traces and right-to-left reveal verified; keyboard
navigation and mobile layout checked. Reduced-motion styles disable animation.
