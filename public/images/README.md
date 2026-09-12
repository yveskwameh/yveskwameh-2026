Every image a visitor downloads is avif or webp, per rule 4 in CLAUDE.md.

wallpaper.avif   the desktop background (export 2560px wide, under 400KB)
avatar.avif      Yves's photo, same as the favicon, 144x144
about/           six photographs of Yves, in the About window, 320 and 800 wide
prints/          nine photographs by Yves, the pile on the desktop, 240 and 1400 wide
projects/        case study covers (96x96) and shots (720x450)
badges/          Upwork and Behance, SVG, with a -dark variant each
feedback/        client avatars

The PNGs that are left are not downloaded as pictures and stay PNG on purpose:
../icons        Yves's pixel art, drawn to the grid in docs/ICON-SPEC.md
../cursors      referenced by the CSS cursor property, which takes no modern format
../og           social card previews, where PNG is what the scrapers all accept
../favicon.png

Dropping new case study screenshots in? Put the PNGs in projects/ and run
`python3 tools/project-images.py` for a report, then `--write` to convert them and
rewrite the paths in src/content/projects. It keeps whichever file is smaller.
