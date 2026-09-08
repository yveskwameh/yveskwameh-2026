"""Make an icon's baked-in frame background transparent.

Figma frames carry a background fill that comes through in the export, and it is not
always white: the desktop set arrived white, the images icon arrived pink. So this samples
the actual corner pixel rather than assuming a colour.

It cannot just delete every pixel of that colour, because the frame colour may also appear
inside the art. It flood fills inward from the border instead, so only the region connected
to the outside edge is cleared and anything enclosed by the black outline survives.
"""
import zlib, struct, sys
from collections import deque

def read_png(path):
    d = open(path, 'rb').read()
    w, h, bd, ct = struct.unpack('>IIBB', d[16:26])
    assert ct == 6 and bd == 8, f'expected 8-bit RGBA, got ct={ct} bd={bd}'
    idat = b''; i = 8
    while i < len(d):
        ln = struct.unpack('>I', d[i:i+4])[0]; typ = d[i+4:i+8]
        if typ == b'IDAT': idat += d[i+8:i+8+ln]
        i += 12 + ln
    raw = zlib.decompress(idat)
    # undo per-scanline filters
    out = bytearray(); prev = bytearray(w*4); pos = 0
    for _ in range(h):
        f = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos+w*4]); pos += w*4
        for x in range(w*4):
            a = line[x-4] if x >= 4 else 0
            b = prev[x]
            c = prev[x-4] if x >= 4 else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a+b)//2) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out += line; prev = line
    return w, h, bytearray(out)

def write_png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y*w*4:(y+1)*w*4]) for y in range(h))
    def chunk(t, data):
        c = t + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    open(path, 'wb').write(png)

def dewhite(path, tol=12):
    w, h, px = read_png(path)
    if px[3] == 0:
        return 0, w*h          # already transparent, nothing to do
    br, bg, bb = px[0], px[1], px[2]   # the frame colour, sampled from the top-left corner
    seen = bytearray(w*h)
    q = deque()
    def near_white(i):
        r, g, b, a = px[i*4:i*4+4]
        return a > 0 and abs(r-br) <= tol and abs(g-bg) <= tol and abs(b-bb) <= tol
    for x in range(w):
        for y in (0, h-1):
            i = y*w + x
            if not seen[i] and near_white(i): seen[i] = 1; q.append(i)
    for y in range(h):
        for x in (0, w-1):
            i = y*w + x
            if not seen[i] and near_white(i): seen[i] = 1; q.append(i)
    cleared = 0
    while q:
        i = q.popleft(); px[i*4+3] = 0; cleared += 1
        x, y = i % w, i // w
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny*w + nx
                if not seen[j] and near_white(j): seen[j] = 1; q.append(j)
    write_png(path, w, h, px)
    return cleared, w*h

for p in sys.argv[1:]:
    c, t = dewhite(p)
    note = 'already transparent' if c == 0 else f'cleared {c:6} of {t} px ({100*c//t}% was background)'
    print(f'  {p.split("/")[-1]:14} {note}')
