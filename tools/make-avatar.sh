#!/bin/sh
# Turn one square photo into the avatar and the favicons.
#   sh tools/make-avatar.sh ~/Downloads/yves.jpg
# Uses sips, which ships with macOS, so there is nothing to install.
set -e
SRC="$1"
[ -f "$SRC" ] || { echo "usage: sh tools/make-avatar.sh <path-to-square-image>"; exit 1; }

mkdir -p public/images

# Avatar: shown at 64px on the lock screen and 22px in the menu bar, so 160px covers
# both at 2x. avif because sips cannot write webp and avif is smaller anyway.
sips -s format avif -s formatOptions 78 -Z 160 "$SRC" --out public/images/avatar.avif >/dev/null

# Favicon: 96px. A tab renders it at 16-32px so this is sharp at 2x, and it doubles as
# the touch icon. 180px was 52KB, which is a lot to spend on something this small.
sips -s format png -Z 96 "$SRC" --out public/favicon.png >/dev/null

# Round it off. The site rounds the avatar with CSS, but the favicon file is its own
# thing, so without this the tab shows a square photo.
python3 tools/round-favicon.py public/favicon.png

echo "wrote:"
ls -l public/images/avatar.avif public/favicon.png | awk '{print "  "$9" "$5" bytes"}'
echo "Now run: npm run build"
