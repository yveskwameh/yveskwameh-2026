"""Draw the Open Graph share card, public/og/default.png, at 1200x630.

PLACEHOLDER. Yves is designing the real card later. This exists so a shared link has a
picture from day one instead of an empty box, and so the tags in Base.astro have a real
file to point at. Replace public/og/default.png and nothing in the code has to change.

Pure Python, same as every other tool in here: there is no Pillow in this project and
adding one for a placeholder would be silly. Text is a 5x7 bitmap font drawn below, one
character per pixel, which is the same idea as tools/draw-cursors.py. Scaled up it reads
as pixel art rather than as bad typography, which is the right accident for this site.

1200x630 is what Facebook, LinkedIn, X and iMessage all want. Anything under 600x315
gets shown as a small square thumbnail instead of a wide card, so the size is the point.

    python3 tools/draw-og.py
"""
import zlib, struct, pathlib

W, H = 1200, 630

# Straight off src/styles/tokens.css, so the card matches the desktop it links to.
DESKTOP = (0x3b, 0x5a, 0x72)   # --os-desktop
CHROME  = (0xe6, 0xe6, 0xe3)   # --os-chrome, the title bar
SURFACE = (0xf3, 0xf3, 0xf1)   # --os-surface, the window body
INK     = (0x16, 0x16, 0x1a)   # --os-ink
MUTED   = (0x6b, 0x6b, 0x70)   # --os-muted
ACCENT  = (0x07, 0x71, 0x67)   # --os-accent
LIGHTS  = [(0xff, 0x5f, 0x57), (0xfe, 0xbc, 0x2e), (0x28, 0xc8, 0x40)]

canvas = bytearray(W * H * 3)


def px(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        i = (y * W + x) * 3
        canvas[i:i + 3] = bytes(c)


def rect(x0, y0, x1, y1, c):
    for y in range(max(0, y0), min(H, y1)):
        row = y * W
        for x in range(max(0, x0), min(W, x1)):
            i = (row + x) * 3
            canvas[i:i + 3] = bytes(c)


def rounded(x0, y0, x1, y1, r, c):
    """Corners are cut against whatever is already there, so draw the background first."""
    for y in range(max(0, y0), min(H, y1)):
        for x in range(max(0, x0), min(W, x1)):
            cx = x0 + r if x < x0 + r else (x1 - 1 - r if x > x1 - 1 - r else x)
            cy = y0 + r if y < y0 + r else (y1 - 1 - r if y > y1 - 1 - r else y)
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                px(x, y, c)


def disc(cx, cy, r, c):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                px(x, y, c)


# ------------------------------------------------------------------ #
# 5x7 uppercase font. '#' is ink, '.' is nothing. Add a glyph by adding a key.
# ------------------------------------------------------------------ #
FONT = {
    'A': '.###.|#...#|#...#|#####|#...#|#...#|#...#',
    'B': '####.|#...#|#...#|####.|#...#|#...#|####.',
    'C': '.###.|#...#|#....|#....|#....|#...#|.###.',
    'D': '####.|#...#|#...#|#...#|#...#|#...#|####.',
    'E': '#####|#....|#....|####.|#....|#....|#####',
    'F': '#####|#....|#....|####.|#....|#....|#....',
    'G': '.###.|#...#|#....|#.###|#...#|#...#|.###.',
    'H': '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    'I': '#####|..#..|..#..|..#..|..#..|..#..|#####',
    'J': '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
    'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    'L': '#....|#....|#....|#....|#....|#....|#####',
    'M': '#...#|##.##|#.#.#|#...#|#...#|#...#|#...#',
    'N': '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
    'O': '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    'P': '####.|#...#|#...#|####.|#....|#....|#....',
    'Q': '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
    'R': '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    'S': '.####|#....|#....|.###.|....#|....#|####.',
    'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    'V': '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    'W': '#...#|#...#|#...#|#...#|#.#.#|##.##|#...#',
    'X': '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    'Y': '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
    'Z': '#####|....#|...#.|..#..|.#...|#....|#####',
    '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
    '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
    '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
    '3': '#####|...#.|..#..|...#.|....#|#...#|.###.',
    '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
    '5': '#####|#....|####.|....#|....#|#...#|.###.',
    '6': '..##.|.#...|#....|####.|#...#|#...#|.###.',
    '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
    '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
    '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
    ' ': '.....|.....|.....|.....|.....|.....|.....',
    '/': '....#|....#|...#.|..#..|.#...|#....|#....',
    '.': '.....|.....|.....|.....|.....|.##..|.##..',
    ',': '.....|.....|.....|.....|.##..|.##..|.#...',
    '-': '.....|.....|.....|.###.|.....|.....|.....',
}
GW, GH, GAP = 5, 7, 1


def text_width(s, scale):
    return (len(s) * (GW + GAP) - GAP) * scale


def text(x, y, s, scale, c):
    """Top-left origin. Unknown characters are skipped rather than crashing the build."""
    for ch in s.upper():
        art = FONT.get(ch)
        if art:
            for ry, row in enumerate(art.split('|')):
                for rx, dot in enumerate(row):
                    if dot == '#':
                        rect(x + rx * scale, y + ry * scale,
                             x + (rx + 1) * scale, y + (ry + 1) * scale, c)
        x += (GW + GAP) * scale


# ------------------------------------------------------------------ #
# The card: one window on the desktop, the way the site looks when it opens.
# ------------------------------------------------------------------ #
rect(0, 0, W, H, DESKTOP)

WX0, WY0, WX1, WY1 = 96, 88, 1104, 542
BAR = 60

# A shadow, faked by drawing a darker rounded rect underneath rather than blurring one.
rounded(WX0 + 6, WY0 + 14, WX1 + 6, WY1 + 14, 18, (0x2c, 0x44, 0x57))
rounded(WX0, WY0, WX1, WY1, 18, SURFACE)
# Title bar. Drawn as a full rounded rect then squared off at the bottom, which is two
# lines instead of clipping maths.
rounded(WX0, WY0, WX1, WY0 + BAR, 18, CHROME)
rect(WX0, WY0 + BAR - 18, WX1, WY0 + BAR, CHROME)
rect(WX0, WY0 + BAR, WX1, WY0 + BAR + 1, (0xd2, 0xd2, 0xd0))

for i, c in enumerate(LIGHTS):
    disc(WX0 + 34 + i * 34, WY0 + BAR // 2, 10, c)

text(WX0 + 150, WY0 + 21, 'yveskwameh', 3, MUTED)

# Body copy, left aligned against the same margin the lights sit on.
TX = WX0 + 64
text(TX, WY0 + 128, 'YVES', 14, INK)
text(TX, WY0 + 238, 'KWAMEH', 14, INK)
text(TX, WY0 + 348, 'UX/UI DESIGNER', 5, ACCENT)
text(TX, WY0 + 390, 'AND NO-CODE DEVELOPER', 5, MUTED)

# ------------------------------------------------------------------ #
# PNG out. Truecolour, 8 bit, filter 0 on every row.
# ------------------------------------------------------------------ #
raw = bytearray()
for y in range(H):
    raw.append(0)
    raw += canvas[y * W * 3:(y + 1) * W * 3]


def chunk(tag, data):
    return (struct.pack('>I', len(data)) + tag + data
            + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))


png = (b'\x89PNG\r\n\x1a\n'
       + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
       + chunk(b'IEND', b''))

out = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'og' / 'default.png'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(png)
print(f'{out.relative_to(out.parent.parent.parent)}  {W}x{H}  {len(png):,} bytes')
