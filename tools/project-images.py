#!/usr/bin/env python3
"""Convert the case study images in public/images/projects to avif.

Rule 4 says webp or avif, and these were the last PNGs on the site that a visitor
actually downloads. The icons, cursors and favicon stay PNG on purpose: the icons are
Yves's pixel art and the cursors are referenced by the CSS cursor property, which is not
a place to be clever about formats.

Run it after dropping new screenshots in:

    python3 tools/project-images.py            # report only, changes nothing
    python3 tools/project-images.py --write    # convert, and keep whichever is smaller

It keeps the smaller file of the two and says so. That matters here because the current
images are flat colour wireframes, which PNG compresses better than avif does: avif pays
a container overhead that a photograph earns back many times over and a four colour
mockup does not. When the real screenshots land, avif will win and this will swap them.

sips is the converter, the same one behind the wallpaper and the prints. ffprobe reads
the dimensions back, because the markdown carries explicit width and height.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'public/images/projects'
CONTENT = ROOT / 'src/content/projects'
WRITE = '--write' in sys.argv


def dims(path):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
         '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', str(path)],
        capture_output=True, text=True).stdout.strip()
    return tuple(int(v) for v in out.split('x'))


pngs = sorted(SRC.glob('*.png'))
if not pngs:
    print('No PNGs in %s. Nothing to do.' % SRC)
    sys.exit(0)

print('%-20s %8s %10s %10s  %s' % ('image', 'pixels', 'png', 'avif', 'keep'))
swapped, kept = [], []
for png in pngs:
    avif = png.with_suffix('.avif')
    r = subprocess.run(
        ['sips', '-s', 'format', 'avif', '-s', 'formatOptions', '70',
         str(png), '--out', str(avif)], capture_output=True, text=True)
    if r.returncode:
        sys.exit('sips failed on %s\n%s' % (png.name, r.stderr[-500:]))

    w, h = dims(png)
    a, b = png.stat().st_size, avif.stat().st_size
    win = b < a
    print('%-20s %4dx%-4d %7.1f KB %7.1f KB  %s'
          % (png.stem, w, h, a / 1024, b / 1024, 'avif' if win else 'png'))
    (swapped if win else kept).append(png.stem)
    if not (win and WRITE):
        avif.unlink()

print()
if swapped:
    print('avif is smaller for: %s' % ', '.join(swapped))
if kept:
    print('png is smaller for: %s' % ', '.join(kept))
if not WRITE:
    print('\nReport only. Nothing was written. Pass --write to convert the ones avif wins.')
    sys.exit(0)

if not swapped:
    print('\nNothing converted, so nothing in %s needs editing.' % CONTENT)
    sys.exit(0)

# The markdown carries the paths, in frontmatter and in inline <img> tags.
edited = 0
for md in CONTENT.glob('*.md'):
    text = original = md.read_text()
    for stem in swapped:
        text = text.replace('/images/projects/%s.png' % stem, '/images/projects/%s.avif' % stem)
    if text != original:
        md.write_text(text)
        edited += 1
        for stem in swapped:
            (SRC / ('%s.png' % stem)).unlink(missing_ok=True)
print('\nRewrote %d markdown file(s) and removed the PNGs that were replaced.' % edited)
