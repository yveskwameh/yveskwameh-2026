Vector sources for the desktop icons, exported from Figma (node 97-698). Nothing here
ships; public/icons/*.png is what the site loads.

These are auto-traced from raster, not drawn on a pixel grid, so the path coordinates
land on no clean grid and the SVGs are large (169KB for the seven, 40KB even brotli'd).
Rasterising them at 128px costs 17KB total, so the site uses PNG. See ICON-SPEC.md, which
already called for PNG.

Re-exporting after a change in Figma:
  1. Export each frame as PNG at 0.0625 scale (2048 -> 128px).
  2. Drop into public/icons with the names in src/data/desktop.ts.
  3. Run: python3 tools/strip-icon-background.py public/icons/*.png

Step 3 matters. The Figma frames have a white background baked in, and it cannot be
removed by colour because white is a real colour in the art, the envelope body and the
monitor highlights among others. The script flood fills inward from the border so only
white connected to the outside edge is cleared.
