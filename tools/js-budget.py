"""Measure the JavaScript a visitor downloads on page load.

The budget in CLAUDE.md is about what loads on arrival, not what the project weighs.
So this counts the inline scripts in the HTML plus every chunk reachable from them
through STATIC imports, and deliberately stops at `import(`: a dynamically imported
chunk is a separate file the browser only fetches when something asks for it, so it
costs nothing until then. Those are listed separately, as information rather than debt.

  python3 tools/js-budget.py [dist/index.html]
"""
import re, sys, pathlib

BUDGET = 10240
page = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'dist/index.html')
dist = page.parent

# A static specifier is preceded by `from` or is a bare side-effect `import"..."`.
# A dynamic one always has a `(` in between, which is what keeps the two apart.
STATIC = re.compile(r'\bfrom\s*["\']([^"\']+)["\']|\bimport\s*["\']([^"\']+)["\']')
DYNAMIC = re.compile(r'\bimport\s*\(\s*["\']([^"\']+)["\']')

html = page.read_text()

# Only scripts the browser actually executes. A <script> carrying a type that is not a
# JavaScript MIME type is a data block: the JSON-LD in Base.astro is the one here, and
# import maps and speculation rules are the same shape. They are bytes in the HTML, and
# they gzip with it, but they are not the client JavaScript the budget is about, and
# counting them made the structured data look like 1.7KB of code.
JS_TYPES = {'', 'module', 'text/javascript', 'application/javascript', 'module/javascript'}


def is_js(tag: str) -> bool:
    m = re.search(r'\btype\s*=\s*["\']([^"\']*)["\']', tag)
    return (m.group(1).strip().lower() if m else '') in JS_TYPES


inline = [body for tag, body in
          re.findall(r'<script((?![^>]*\bsrc=)[^>]*)>(.*?)</script>', html, re.S)
          if is_js(tag)]
entries = [src for tag, src in re.findall(r'<script([^>]*\bsrc="([^"]+)"[^>]*)>', html)
           if is_js(tag)]

eager, lazy, seen = {}, {}, set()

def walk(url, into):
    f = dist / url.lstrip('/').replace('_astro/', '_astro/', 1) if url.startswith('/') else None
    f = (dist / url.lstrip('/')) if url.startswith('/') else (dist / '_astro' / pathlib.Path(url).name)
    if not f.exists() or f.name in seen:
        return
    seen.add(f.name)
    src = f.read_text()
    into[f.name] = len(src.encode())
    for a, b in STATIC.findall(src):
        walk(a or b, into)
    for d in DYNAMIC.findall(src):
        walk(d, lazy)          # everything past a dynamic import is lazy too

for e in entries:
    walk(e, eager)

inline_bytes = sum(len(s.encode()) for s in inline)
total = inline_bytes + sum(eager.values())

print(f'  {"inline in index.html":<52} {inline_bytes:>6}')
for name, n in sorted(eager.items(), key=lambda kv: -kv[1]):
    print(f'  {name:<52} {n:>6}')
print(f'  {"":-<52} {"":->6}')
print(f'  {"INITIAL LOAD":<52} {total:>6}  of {BUDGET}  ({BUDGET - total:+} headroom)')
if lazy:
    print('\n  fetched only when the app that needs it is opened:')
    for name, n in sorted(lazy.items(), key=lambda kv: -kv[1]):
        print(f'  {name:<52} {n:>6}')
sys.exit(0 if total <= BUDGET else 1)
