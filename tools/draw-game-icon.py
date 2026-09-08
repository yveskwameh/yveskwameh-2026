"""Draw the Tic Tac Toe desktop icon, 32x32, in the fixed palette from docs/ICON-SPEC.md.

Every other desktop icon is drawn by Yves in Figma. This one was referenced in
src/data/desktop.ts before it existed, so the desktop had a blank 48px hole where the
game should be. This fills it in the same style and the same sixteen colours, and it is
meant to be replaced by a drawn one whenever Yves gets to it.

  python3 tools/draw-game-icon.py

Writes public/icons/game.png at 96x96 (3x, nearest neighbour, per the spec).
Same pure-Python PNG writer as tools/round-favicon.py, so there is nothing to install.
"""
import zlib, struct, pathlib

P = {
    'k': (0x00, 0x00, 0x00), 'd': (0x80, 0x80, 0x80), 'g': (0xC0, 0xC0, 0xC0),
    'w': (0xFF, 0xFF, 0xFF), 'r': (0xFF, 0x00, 0x00), 'b': (0x00, 0x00, 0xFF),
    'n': (0x00, 0x00, 0x80),
}
N = 32
px = [[None] * N for _ in range(N)]           # None means transparent


def put(x, y, c):
    if 0 <= x < N and 0 <= y < N:
        px[y][x] = c


def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(x, y, c)


# The card: black outline, grey face, white light from the top left and grey shadow
# opposite, which is the whole Win98 bevel in four lines.
rect(1, 1, 30, 30, 'k')
rect(2, 2, 29, 29, 'g')
rect(2, 2, 29, 2, 'w'); rect(2, 2, 2, 29, 'w')
rect(2, 29, 29, 29, 'd'); rect(29, 2, 29, 29, 'd')

# The board. The card's usable face is 3 to 28, which is 26 pixels, so two 1px lines
# leave three cells of exactly 8. Even cells are the whole reason for those numbers: an
# uneven grid is the first thing the eye catches at this size.
for n in (11, 20):
    rect(n, 3, n, 28, 'd')       # verticals
    rect(3, n, 28, n, 'd')       # horizontals

# X in the top left cell, inset by one and two pixels thick so it survives at 16px.
for i in range(6):
    for o in (0, 1):
        put(4 + i + o, 4 + i, 'r')      # top left to bottom right
        put(9 - i + o, 4 + i, 'r')      # and back the other way

# O in the middle cell, drawn by distance from the cell's centre so it stays round.
cx = cy = 15.5
for y in range(N):
    for x in range(N):
        d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
        if 1.7 < d <= 3.6:
            put(x, y, 'n')

SCALE = 3
W = N * SCALE
rows = b''
for y in range(N):
    line = bytearray()
    for x in range(N):
        c = px[y][x]
        rgba = (*P[c], 255) if c else (0, 0, 0, 0)
        line += bytes(rgba) * SCALE
    rows += (b'\x00' + bytes(line)) * SCALE


def chunk(t, data):
    c = t + data
    return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)


out = pathlib.Path('public/icons/game.png')
out.write_bytes(
    b'\x89PNG\r\n\x1a\n'
    + chunk(b'IHDR', struct.pack('>IIBBBBB', W, W, 8, 6, 0, 0, 0))
    + chunk(b'IDAT', zlib.compress(rows, 9))
    + chunk(b'IEND', b''))
print(f'  {out}: {W}x{W}, {out.stat().st_size} bytes')
