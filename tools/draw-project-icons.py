"""Placeholder project icons for the Work window.

  python3 tools/draw-project-icons.py   ->  public/images/projects/*.png

The Work browser is laid out like macOS System Settings, so each case study needs a small
app-style icon rather than a wide screenshot: 20px in the sidebar, 72px in the pane header.
That is the only image a case study needs, which is why these are 96px squares and a
kilobyte each instead of a 1200px hero.

They are deliberately abstract, a rounded square split on the diagonal. They read as icons
without pretending to be screenshots of work that is not there yet. Replace them with real
marks whenever you like, same filenames.
"""
import zlib, struct, pathlib, math

SIZE = 96
R = 21          # corner radius, roughly the iOS/macOS proportion at this size

ICONS = {
    'car-guys': ((0xC0, 0x3A, 0x2B), (0x7A, 0x1B, 0x14)),
    'compass':  ((0x0E, 0x9C, 0x8D), (0x07, 0x71, 0x67)),
    'path':     ((0x3B, 0x5A, 0xA8), (0x22, 0x33, 0x66)),
    'yves-os':  ((0x2C, 0x33, 0x3E), (0x14, 0x18, 0x20)),
}


def rounded(x, y):
    """Distance test for a squircle-ish rounded square, with a 1px feather."""
    cx = min(max(x, R), SIZE - 1 - R)
    cy = min(max(y, R), SIZE - 1 - R)
    d = math.hypot(x - cx, y - cy)
    if d <= R - 1:
        return 255
    if d >= R:
        return 0
    return int((R - d) * 255)


def write(path, top, bottom):
    rows = b''
    for y in range(SIZE):
        line = bytearray()
        for x in range(SIZE):
            a = rounded(x, y)
            # Split on the diagonal, with a soft seam so it does not look like two halves
            # bolted together.
            t = (x + y) / (SIZE * 2 - 2)
            t = min(1, max(0, (t - .28) / .44))
            c = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
            line += bytes((*c, a))
        rows += b'\x00' + bytes(line)

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    pathlib.Path(path).write_bytes(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(rows, 9))
        + chunk(b'IEND', b''))


out = pathlib.Path('public/images/projects')
out.mkdir(parents=True, exist_ok=True)
for name, (a, b) in ICONS.items():
    p = out / f'{name}.png'
    write(p, a, b)
    print(f'  {p}: {SIZE}x{SIZE}, {p.stat().st_size} bytes')
