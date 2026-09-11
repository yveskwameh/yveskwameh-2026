"""Draw the Open Graph share cards at 1200x630.

    python3 tools/draw-og.py

Writes public/og/default.png, plus public/og/work/<id>.png for every case study in
src/content/projects. src/pages/work/[id].astro picks up a case study's card if the file
exists and falls back to the default one if it does not, so adding a case study and
forgetting to run this degrades to a generic card rather than a broken preview.

PLACEHOLDER. Yves is designing the real cards later. These exist so a shared link has a
picture from day one instead of an empty box. Replace any PNG and nothing in the code has
to change.

Pure Python, same as every other tool in here: there is no Pillow in this project and
adding one for a placeholder would be silly. Text is a 5x7 bitmap font drawn below, one
character per pixel, which is the same idea as tools/draw-cursors.py. Scaled up it reads
as pixel art rather than as bad typography, which is the right accident for this site.

1200x630 is what Facebook, LinkedIn, X and iMessage all want. Anything under 600x315
gets shown as a small square thumbnail instead of a wide card, so the size is the point.
"""
import zlib, struct, pathlib, re, sys

W, H = 1200, 630

# Straight off src/styles/tokens.css, so the card matches the desktop it links to.
DESKTOP = (0x3b, 0x5a, 0x72)   # --os-desktop
CHROME  = (0xe6, 0xe6, 0xe3)   # --os-chrome, the title bar
SURFACE = (0xf3, 0xf3, 0xf1)   # --os-surface, the window body
INK     = (0x16, 0x16, 0x1a)   # --os-ink
MUTED   = (0x6b, 0x6b, 0x70)   # --os-muted
ACCENT  = (0x07, 0x71, 0x67)   # --os-accent
LIGHTS  = [(0xff, 0x5f, 0x57), (0xfe, 0xbc, 0x2e), (0x28, 0xc8, 0x40)]

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Characters the font cannot draw, collected across every card and reported once at the
# end. Silently dropping them is how a card ends up saying "PATH CATALOG" as "PATH CATALO"
# and nobody notices until it is on LinkedIn.
missing = set()


# ------------------------------------------------------------------ #
# Canvas. One per card, so drawing a second one cannot inherit the first.
# ------------------------------------------------------------------ #
class Canvas:
    def __init__(self):
        self.buf = bytearray(W * H * 3)

    def px(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            i = (y * W + x) * 3
            self.buf[i:i + 3] = bytes(c)

    def rect(self, x0, y0, x1, y1, c):
        b = bytes(c)
        for y in range(max(0, y0), min(H, y1)):
            row = y * W
            for x in range(max(0, x0), min(W, x1)):
                i = (row + x) * 3
                self.buf[i:i + 3] = b

    def rounded(self, x0, y0, x1, y1, r, c):
        """Corners are cut against whatever is already there, so draw the background first."""
        for y in range(max(0, y0), min(H, y1)):
            for x in range(max(0, x0), min(W, x1)):
                cx = x0 + r if x < x0 + r else (x1 - 1 - r if x > x1 - 1 - r else x)
                cy = y0 + r if y < y0 + r else (y1 - 1 - r if y > y1 - 1 - r else y)
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.px(x, y, c)

    def disc(self, cx, cy, r, c):
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.px(x, y, c)

    def text(self, x, y, s, scale, c):
        """Top-left origin. Unknown characters are noted and skipped, not drawn."""
        for ch in s.upper():
            art = FONT.get(ch)
            if art:
                for ry, row in enumerate(art.split('|')):
                    for rx, dot in enumerate(row):
                        if dot == '#':
                            self.rect(x + rx * scale, y + ry * scale,
                                      x + (rx + 1) * scale, y + (ry + 1) * scale, c)
            elif ch != ' ':
                missing.add(ch)
            x += (GW + GAP) * scale


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
    'I': '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
    'J': '....#|....#|....#|....#|#...#|#...#|.###.',
    'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    'L': '#....|#....|#....|#....|#....|#....|#####',
    'M': '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    'N': '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
    'O': '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    'P': '####.|#...#|#...#|####.|#....|#....|#....',
    'Q': '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
    'R': '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    'S': '.####|#....|#....|.###.|....#|....#|####.',
    'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    'V': '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    'W': '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
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
    "'": '..#..|..#..|.....|.....|.....|.....|.....',
    '&': '.##..|#..#.|#..#.|.##..|#.#.#|#..#.|.##.#',
    ':': '.....|.##..|.##..|.....|.##..|.##..|.....',
    '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
    '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
}
GW, GH, GAP = 5, 7, 1

WX0, WY0, WX1, WY1 = 96, 88, 1104, 542
BAR = 60
TX = WX0 + 64                       # body copy margin
MAXW = (WX1 - WX0) - 128            # room for a line of title, 880px


def text_width(s, scale):
    return (len(s) * (GW + GAP) - GAP) * scale


def fit(s, lo, hi, width=MAXW):
    """Largest scale in [lo, hi] where s fits in width. lo if nothing does."""
    for scale in range(hi, lo - 1, -1):
        if text_width(s, scale) <= width:
            return scale
    return lo


def wrap(s, scale, width=MAXW):
    """Greedy wrap on spaces. Long single words are left long and shrunk by fit()."""
    lines, line = [], ''
    for word in s.split():
        trial = f'{line} {word}'.strip()
        if line and text_width(trial, scale) > width:
            lines.append(line)
            line = word
        else:
            line = trial
    if line:
        lines.append(line)
    return lines


def window(c, caption):
    """The shared frame: desktop, one window, the lights, and a filename in the title bar."""
    c.rect(0, 0, W, H, DESKTOP)
    # A shadow, faked by drawing a darker rounded rect underneath rather than blurring one.
    c.rounded(WX0 + 6, WY0 + 14, WX1 + 6, WY1 + 14, 18, (0x2c, 0x44, 0x57))
    c.rounded(WX0, WY0, WX1, WY1, 18, SURFACE)
    # Title bar. Drawn as a full rounded rect then squared off at the bottom, which is two
    # lines instead of clipping maths.
    c.rounded(WX0, WY0, WX1, WY0 + BAR, 18, CHROME)
    c.rect(WX0, WY0 + BAR - 18, WX1, WY0 + BAR, CHROME)
    c.rect(WX0, WY0 + BAR, WX1, WY0 + BAR + 1, (0xd2, 0xd2, 0xd0))
    for i, col in enumerate(LIGHTS):
        c.disc(WX0 + 34 + i * 34, WY0 + BAR // 2, 10, col)
    c.text(WX0 + 150, WY0 + 21, caption, 3, MUTED)


def default_card():
    c = Canvas()
    window(c, 'yveskwameh')
    c.text(TX, WY0 + 128, 'YVES', 14, INK)
    c.text(TX, WY0 + 238, 'KWAMEH', 14, INK)
    c.text(TX, WY0 + 348, 'UX/UI DESIGNER', 5, ACCENT)
    c.text(TX, WY0 + 390, 'AND NO-CODE DEVELOPER', 5, MUTED)
    return c


def case_study_card(title, client, year, filename):
    """Same window, with the case study's own name in it and the client underneath."""
    c = Canvas()
    window(c, filename)

    c.text(TX, WY0 + 112, 'CASE STUDY', 4, ACCENT)

    # One line if it fits big, two if it does not. Two 12s read better than one squeezed 7.
    scale = fit(title, 7, 14)
    lines = [title] if scale >= 11 else wrap(title, (scale := fit(title, 7, 12)))
    if len(lines) > 2:                       # never more than two, shrink instead
        scale = fit(title, 6, 9)
        lines = wrap(title, scale)[:2]
    y = WY0 + 160
    for line in lines:
        c.text(TX, y, line, scale, INK)
        y += (GH + 1) * scale

    foot = f'{client}  {year}'.strip()
    c.text(TX, WY1 - 108, foot, 5, MUTED)
    c.text(TX, WY1 - 66, 'YVES KWAMEH', 5, ACCENT)
    return c


# ------------------------------------------------------------------ #
# PNG out. Truecolour, 8 bit, filter 0 on every row.
# ------------------------------------------------------------------ #
def write_png(c, out):
    raw = bytearray()
    for y in range(H):
        raw.append(0)
        raw += c.buf[y * W * 3:(y + 1) * W * 3]

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(png)
    print(f'  {out.relative_to(ROOT)}  {W}x{H}  {len(png):,} bytes')


# ------------------------------------------------------------------ #
# Frontmatter. Plain scalars only, which is all content.config.ts allows for these four
# fields. Not a YAML parser and not trying to be: it reads the block between the first two
# --- lines and takes `key: value`, unquoting if quoted.
# ------------------------------------------------------------------ #
def frontmatter(path):
    text = path.read_text(encoding='utf-8')
    m = re.match(r'^---\n(.*?)\n---', text, re.S)
    if not m:
        return {}
    out = {}
    for line in m.group(1).split('\n'):
        kv = re.match(r'^([a-zA-Z_]+):\s*(.*)$', line)
        if kv:
            out[kv.group(1)] = kv.group(2).strip().strip('"').strip("'")
    return out


if __name__ == '__main__':
    print('Open Graph cards:')
    write_png(default_card(), ROOT / 'public' / 'og' / 'default.png')

    src = ROOT / 'src' / 'content' / 'projects'
    # The underscore prefix is how content.config.ts marks a file as not a case study.
    for md in sorted(src.glob('*.md')):
        if md.name.startswith('_'):
            continue
        fm = frontmatter(md)
        if not fm.get('title'):
            print(f'  skipped {md.name}: no title in the frontmatter', file=sys.stderr)
            continue
        card = case_study_card(fm['title'], fm.get('client', ''), fm.get('year', ''),
                               fm.get('filename', md.stem))
        write_png(card, ROOT / 'public' / 'og' / 'work' / f'{md.stem}.png')

    if missing:
        print(f'\nWARNING: no glyph for {sorted(missing)}. Those characters were left out '
              f'of the cards. Add them to FONT in this file.', file=sys.stderr)
