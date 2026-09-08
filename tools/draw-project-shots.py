"""Placeholder screenshots for the case studies.

  python3 tools/draw-project-shots.py   ->  public/images/projects/<slug>-1.png, -2.png

Each one is a flat mock of a page: a window bar with three dots, a heading block, some
text lines and a couple of panels, tinted to that project's colour. Deliberately abstract.
A real screenshot would be better and these are not pretending to be one, they are holding
the space so the layout can be judged before the real work is dropped in. Same filenames
when you replace them.

Pure-Python PNG, same writer as the other tools here, so there is nothing to install.
Flat blocks compress to a few kilobytes each.
"""
import zlib, struct, pathlib

W, H = 720, 450
PAPER = (0xF4, 0xF4, 0xF2)
BAR = (0xE4, 0xE4, 0xE1)
DOTS = [(0xFF, 0x5F, 0x57), (0xFE, 0xBC, 0x2E), (0x28, 0xC8, 0x40)]

PROJECTS = {
    'car-guys': (0xC0, 0x3A, 0x2B),
    'compass':  (0x0E, 0x9C, 0x8D),
    'path':     (0x3B, 0x5A, 0xA8),
    'yves-os':  (0x2C, 0x33, 0x3E),
}


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def shot(tint, variant):
    px = [[PAPER] * W for _ in range(H)]

    def rect(x0, y0, x1, y1, c):
        for y in range(max(0, y0), min(H, y1)):
            row = px[y]
            for x in range(max(0, x0), min(W, x1)):
                row[x] = c

    # window chrome
    rect(0, 0, W, 34, BAR)
    for i, d in enumerate(DOTS):
        cx = 22 + i * 20
        for y in range(11, 23):
            for x in range(cx - 6, cx + 6):
                if (x - cx + .5) ** 2 + (y - 17 + .5) ** 2 <= 36:
                    px[y][x] = d

    if variant == 1:
        # a hero: big colour band, heading bar, two lines, three cards
        rect(0, 34, W, 210, tint)
        rect(56, 96, 400, 122, mix(tint, (255, 255, 255), .78))
        rect(56, 134, 320, 148, mix(tint, (255, 255, 255), .55))
        rect(56, 156, 250, 170, mix(tint, (255, 255, 255), .45))
        for i in range(3):
            x = 56 + i * 208
            rect(x, 248, x + 176, 384, mix(PAPER, tint, .12))
            rect(x + 20, 272, x + 120, 286, mix(PAPER, tint, .45))
            rect(x + 20, 300, x + 156, 310, mix(PAPER, tint, .25))
            rect(x + 20, 318, x + 132, 328, mix(PAPER, tint, .25))
    else:
        # a detail: sidebar and a list of rows
        rect(0, 34, 210, H, mix(PAPER, tint, .10))
        rect(28, 70, 150, 84, mix(PAPER, tint, .5))
        for i in range(5):
            y = 112 + i * 40
            rect(28, y, 44, y + 16, mix(PAPER, tint, .55))
            rect(56, y + 3, 168, y + 13, mix(PAPER, tint, .28))
        rect(250, 70, 520, 96, mix(PAPER, tint, .6))
        for i in range(6):
            y = 128 + i * 34
            rect(250, y, 250 + (400 if i % 3 else 300), y + 12, mix(PAPER, tint, .2))
        rect(250, 348, 400, 384, tint)

    rows = b''
    for y in range(H):
        line = bytearray()
        for x in range(W):
            line += bytes(px[y][x])
        rows += b'\x00' + bytes(line)

    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(rows, 9))
            + chunk(b'IEND', b''))


out = pathlib.Path('public/images/projects')
out.mkdir(parents=True, exist_ok=True)
for slug, tint in PROJECTS.items():
    for v in (1, 2):
        p = out / f'{slug}-{v}.png'
        p.write_bytes(shot(tint, v))
        print(f'  {p}: {W}x{H}, {p.stat().st_size} bytes')
