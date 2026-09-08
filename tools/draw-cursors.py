"""Draw the retro pixel cursor set.

  python3 tools/draw-cursors.py    ->  public/cursors/*.png

Each cursor is ASCII art, one character per art pixel, scaled up by whole numbers so the
edges stay hard. Keeping the art as text is the point: the shapes are readable and
editable right here, and nobody has to open a pixel editor to nudge one row.

  .  transparent      K  black outline      W  white fill      T  brand teal

Sizing. The art is drawn 1:1 now, so the arrow paints at 11x16 CSS px, about the size of a
system cursor. It used to be scaled 2x, which made it 22x32 and read as oversized. The
canvas is ART_BOX * scale, stated rather than implied, so the art can never be silently
clipped by a canvas that is too small for it. A 2x file is written alongside each one for
retina, wired up with image-set in tokens.css, because a soft pixel-art cursor defeats the
whole idea. Browsers get unreliable above 32x32; both files are inside that.

The hotspot for each cursor lives in tokens.css, in 1x image pixels. If a scale ever
changes here, those numbers have to change with it or every click lands slightly off.
"""
import zlib, struct, pathlib

PALETTE = {
    'K': (0x00, 0x00, 0x00, 255),
    'W': (0xFF, 0xFF, 0xFF, 255),
    'T': (0x07, 0x71, 0x67, 255),   # --os-accent, so clickable things go brand teal
    '.': (0, 0, 0, 0),
}

# The classic arrow, built from its outline rather than typed out row by row. Counting
# a diagonal by hand goes wrong every time, and it did: the first version came out with a
# hollow tail. A polygon cannot drift.
#
# Points run clockwise from the tip: down the left edge, out to the foot, down and around
# the tail, then back along the shelf to the 45 degree hypotenuse of the head.
# 16 rows, not 17: the canvas is 32px and the art is scaled 2x, so anything taller than
# 16 gets its tail clipped off the bottom, which is exactly what happened first time.
ARROW_SHAPE = [(0, 0), (0, 12), (3, 9), (5, 15), (9, 14), (6, 8), (10, 8)]
ARROW_W, ARROW_H = 11, 16


def inside(px, py, polys):
    """Even-odd test at the pixel's centre, against a union of polygons.

    A union rather than one shape because the resize arrow is three pieces, two heads and
    a shaft, and describing it as one outline would mean threading the boundary back on
    itself."""
    x, y = px + .5, py + .5
    for poly in polys:
        hit = False
        for i in range(len(poly)):
            ax, ay = poly[i]
            bx, by = poly[(i + 1) % len(poly)]
            if (ay > y) != (by > y) and x < ax + (y - ay) / (by - ay) * (bx - ax):
                hit = not hit
        if hit:
            return True
    return False


def outlined(polys, w, h, fill='W'):
    """Fill the shape white, then blacken every filled pixel that touches an empty one.

    Outlining here, at art resolution, rather than after scaling is what keeps the border
    exactly one art pixel thick all the way round instead of two image pixels in some
    places and none in others."""
    solid = [[inside(x, y, polys) for x in range(w)] for y in range(h)]
    rows = []
    for y in range(h):
        row = ''
        for x in range(w):
            if not solid[y][x]:
                row += '.'
                continue
            edge = any(
                not (0 <= x + dx < w and 0 <= y + dy < h and solid[y + dy][x + dx])
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            row += 'K' if edge else fill
        rows.append(row)
    return rows


ARROW = outlined([ARROW_SHAPE], ARROW_W, ARROW_H)

# The pointing hand, in brand teal, so anything you can click turns teal under the cursor.
HAND = [
    '...KK.........',
    '..KTTK........',
    '..KTTK........',
    '..KTTK........',
    '..KTTKKK......',
    '..KTTKTTKK....',
    '..KTTKTTKTTK..',
    'KKKTTKTTKTTK..',
    'KTTTTTTTTTTTK.',
    'KTTTTTTTTTTTK.',
    '.KTTTTTTTTTTK.',
    '.KTTTTTTTTTTK.',
    '..KTTTTTTTTK..',
    '..KTTTTTTTTK..',
    '..KKKKKKKKKK..',
    '..............',
]

# The I-beam, for the message fields.
TEXT = [
    'KKKKKKK',
    'KWWWWWK',
    'KKKWKKK',
    '..KWK..',
    '..KWK..',
    '..KWK..',
    '..KWK..',
    '..KWK..',
    '..KWK..',
    '..KWK..',
    '..KWK..',
    '..KWK..',
    'KKKWKKK',
    'KWWWWWK',
    'KKKKKKK',
    '.......',
]

# The open hand, for a window title bar you can pick up. Teal like the pointing hand, so
# "hand means you can act on this" stays one idea.
GRAB = [
    '...KK.KK.KK...',
    '..KTTKTTKTTK..',
    '..KTTKTTKTTK..',
    '.KKTTKTTKTTK..',
    'KTTKTTTTTTTTK.',
    'KTTTTTTTTTTTK.',
    'KTTTTTTTTTTTK.',
    '.KTTTTTTTTTTK.',
    '.KTTTTTTTTTTK.',
    '..KTTTTTTTTK..',
    '..KTTTTTTTTK..',
    '...KKKKKKKK...',
    '..............',
    '..............',
    '..............',
    '..............',
]

# The closed fist, while a window is actually being dragged.
GRABBING = [
    '..............',
    '..............',
    '...KKKKKKK....',
    '..KTTTTTTTK...',
    '.KKTTTTTTTTK..',
    'KTTKTTTTTTTK..',
    'KTTTTTTTTTTK..',
    '.KTTTTTTTTTK..',
    '.KTTTTTTTTTK..',
    '..KTTTTTTTK...',
    '..KTTTTTTTK...',
    '...KKKKKKK....',
    '..............',
    '..............',
    '..............',
    '..............',
]

# The corner resize arrow: two heads and a shaft, drawn as a union because one outline
# would have to thread back on itself. White like the pointer, since resizing is a
# structural gesture rather than a "click me".
RESIZE_NWSE_SHAPE = [
    [(0, 0), (9, 0), (0, 9)],              # north-west head
    [(15, 15), (6, 15), (15, 6)],          # south-east head
    [(0, 3), (3, 0), (15, 12), (12, 15)],  # the shaft between them
]

def mirror(polys):
    """Flip left to right, so one diagonal arrow gives both of them."""
    return [[(15 - x, y) for x, y in poly] for poly in polys]

RESIZE = outlined(RESIZE_NWSE_SHAPE, 16, 16)
RESIZE_NESW = outlined(mirror(RESIZE_NWSE_SHAPE), 16, 16)

# The straight pair: a head at each end and a shaft between. The heads have to stop well
# short of the middle, or at 16px the two triangles meet and the whole thing reads as a
# diamond rather than an arrow.
RESIZE_NS = outlined([
    [(8, 0), (4, 5), (12, 5)],
    [(8, 15), (4, 10), (12, 10)],
    [(6, 3), (9, 3), (9, 12), (6, 12)],
], 16, 16)
RESIZE_EW = outlined([
    [(0, 8), (5, 4), (5, 12)],
    [(15, 8), (10, 4), (10, 12)],
    [(3, 6), (3, 9), (12, 9), (12, 6)],
], 16, 16)


# The art all fits a 16x16 box; the canvas is that times the scale, so nothing clips.
ART_BOX = 16


def png(path, art, scale):
    """Write the art into a square canvas, scaled, top-left anchored."""
    size = ART_BOX * scale          # scale 1 -> 16px, scale 2 -> 32px (the retina file)
    step = scale
    rows = b''
    for y in range(size):
        line = bytearray()
        ay = y // step
        for x in range(size):
            ax = x // step
            ch = art[ay][ax] if ay < len(art) and ax < len(art[ay]) else '.'
            line += bytes(PALETTE[ch])
        rows += b'\x00' + bytes(line)

    def chunk(t, data):
        c = t + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    pathlib.Path(path).write_bytes(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(rows, 9))
        + chunk(b'IEND', b''))
    return size


out = pathlib.Path('public/cursors')
out.mkdir(parents=True, exist_ok=True)
for name, art in (('arrow', ARROW), ('hand', HAND), ('text', TEXT),
                  ('grab', GRAB), ('grabbing', GRABBING),
                  ('resize-nwse', RESIZE), ('resize-nesw', RESIZE_NESW),
                  ('resize-ns', RESIZE_NS), ('resize-ew', RESIZE_EW)):
    # 1x then 2x. The pair must stay in a 1:2 ratio or image-set hands the browser a
    # retina file that does not line up with the standard one.
    for suffix, scale in (('', 1), ('@2x', 2)):
        p = out / f'{name}{suffix}.png'
        n = png(p, art, scale)
        print(f'  {p}: {n}x{n}, {p.stat().st_size} bytes')
