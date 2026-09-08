"""Mask a square PNG into a circle, so the browser tab shows a round avatar.

sips cannot do this, and the site rounds the avatar with CSS which the favicon never
sees. Same pure-Python PNG decode and encode as tools/strip-icon-background.py, applied
to the alpha channel: transparent outside the inscribed circle, with a one pixel feather
so the edge does not look chewed at 16px.
"""
import zlib, struct, sys, pathlib


def read_png(path):
    d = pathlib.Path(path).read_bytes()
    w, h, bd, ct = struct.unpack('>IIBB', d[16:26])
    assert ct == 6 and bd == 8, f'expected 8-bit RGBA, got ct={ct} bd={bd}'
    idat, i = b'', 8
    while i < len(d):
        ln = struct.unpack('>I', d[i:i + 4])[0]
        if d[i + 4:i + 8] == b'IDAT':
            idat += d[i + 8:i + 8 + ln]
        i += 12 + ln
    raw = zlib.decompress(idat)
    out, prev, pos = bytearray(), bytearray(w * 4), 0
    for _ in range(h):
        f = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos + w * 4]); pos += w * 4
        for x in range(w * 4):
            a = line[x - 4] if x >= 4 else 0
            b = prev[x]
            c = prev[x - 4] if x >= 4 else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out += line; prev = line
    return w, h, bytearray(out)


def write_png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))

    def chunk(t, data):
        c = t + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    pathlib.Path(path).write_bytes(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b''))


def circle(path):
    w, h, px = read_png(path)
    cx, cy = (w - 1) / 2, (h - 1) / 2
    r = min(w, h) / 2
    for y in range(h):
        for x in range(w):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            i = (y * w + x) * 4 + 3
            if d > r:
                px[i] = 0
            elif d > r - 1:                      # one pixel feather
                px[i] = int(px[i] * (r - d))
    write_png(path, w, h, px)
    return w, h


for p in sys.argv[1:]:
    w, h = circle(p)
    print(f'  {p.split("/")[-1]}: {w}x{h} masked to a circle, {pathlib.Path(p).stat().st_size} bytes')
