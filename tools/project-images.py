#!/usr/bin/env python3
"""Build the responsive image ladder for the case studies.

Why this exists
---------------
Every case study shot used to be a single 720px wide file. That was right when the pane
was 601px wide. It stopped being right the moment the Work window grew a zoom control and
a collapsible sidebar, because the pane now reaches 1438px, and on a 2x screen that is a
720px image stretched across 2876 device pixels. Four times upscale. The result reads as
blurry, and no amount of avif quality fixes it, because it is a resolution problem rather
than a compression one.

The fix is not simply bigger files. One 2160px image served to a phone trades blur for
weight. So each shot becomes a ladder of widths and the browser picks, which is what
srcset is for.

How it works
------------
The tool is driven by the markdown, not by whatever happens to be sitting in the images
folder. For every `<img src="/images/projects/<stem>.avif">` it finds in
`src/content/projects/*.md`, it looks for a high resolution source at

    assets/project-shots/<stem>.png              (or .jpg, .jpeg, .avif)

If that source exists it emits `<stem>@<w>.avif` for each width in the ladder, then
rewrites the tag with a `srcset` and a `sizes`. If it does not exist the tag is left
exactly as it is and the run reports it as waiting for a source. That means shots can be
re-shot one project at a time rather than all at once.

The ladder depends on how wide the image is actually allowed to get, which is a CSS fact
in CaseStudy.astro, not a guess:

    no class    the pane, up to 1438px            720, 1440, 2880
    .tall       capped at min(100%, 420px)        420, 840
    .tall-lg    capped at min(100%, 560px)        560, 1120

A width larger than the source is never emitted, because upscaling during the build is the
thing this tool exists to stop. If a source is too small for its top rung the run says so,
so the answer is a better export rather than a bigger file that carries no more detail.

A note on `sizes`, because it looks wrong and is not. The pane is 601px at rest and only
reaches 1438px once the visitor zooms the window or collapses the rail, but `sizes` is
resolved when the tag is parsed, long before either of those happens. So it describes the
widest the pane can get. The cost is that a desktop reading a case study at the default
window size fetches a somewhat larger file than it strictly needs, roughly 52KB instead of
21KB. The alternative is a visitor who zooms and sees blur, which is the bug this whole
tool exists to fix, so the trade goes this way.

`sizes="auto"` is the feature designed for exactly this and it was measured rather than
assumed: Chrome here does not support it, and an unsupported `auto` does not degrade to
the rest of the list, it invalidates the whole attribute and the browser falls back to
100vw. That is worse than the fixed value in every case, so it is deliberately not used.
Worth revisiting once Safari ships it.

The banner is not in the markdown body, it is the `banner` field in frontmatter rendered
by CaseStudy.astro. It gets the same treatment through a `bannerSrcset` field that the
component reads.

`assets/project-shots` is the working store of full resolution shots. It sits outside
`public` on purpose, because everything under `public` is copied into the deploy verbatim
and a folder of 2880px masters is not something visitors should be able to download.

Usage
-----
    npm run build
    zsh tools/shoot-project-images.sh          # capture what can be captured from a URL
    python3 tools/project-images.py            # report only, changes nothing
    python3 tools/project-images.py --write    # generate the files and rewrite the markdown

tools/shoot-project-images.sh writes the masters this reads. Do not take screenshots with
`chrome --headless --window-size=393,850` directly: Chrome clamps the window to about 500px
wide, lays out at 500, and then screenshots the 393 you asked for, so the right hand side of
every phone shot is missing. That harness exists to work around it and says so.

sips is the converter, the same one behind the wallpaper and the prints. ffprobe reads
dimensions back, because the markdown carries explicit width and height and a wrong ratio
is layout shift.
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMAGES = ROOT / 'public/images/projects'
SOURCES = ROOT / 'assets/project-shots'
CONTENT = ROOT / 'src/content/projects'
WRITE = '--write' in sys.argv

# Width ladder and the `sizes` that goes with it, keyed by the class on the tag. These
# mirror the caps in CaseStudy.astro. If that CSS changes, change this with it.
LADDERS = {
    # The top rung is 2880 rather than a rounder 2160 because that is the exact number the
    # widest case actually needs: the pane reaches 1438 CSS pixels once the window is zoomed
    # and the rail collapsed, which on a 2x screen is 2876 device pixels. 2160 left a 1.33x
    # upscale in precisely the state a designer is most likely to look at. The masters are
    # 2880 wide, so nothing is invented to fill it.
    '':        ([720, 1440, 2880], '(max-width: 640px) 100vw, min(100vw, 1440px)'),
    'tall':    ([420, 840],        '(max-width: 640px) 100vw, 420px'),
    'tall-lg': ([560, 1120],       '(max-width: 640px) 100vw, 560px'),
}
# The banner is always full pane width, and it has no class of its own.
BANNER_LADDER = LADDERS['']

SOURCE_SUFFIXES = ('.png', '.jpg', '.jpeg', '.avif')
IMG_TAG = re.compile(r'<img\b[^>]*?>', re.S)
SRC_ATTR = re.compile(r'src="/images/projects/([A-Za-z0-9._-]+?)(?:@\d+)?\.avif"')
CLASS_ATTR = re.compile(r'class="([^"]*)"')
BANNER_FIELD = re.compile(
    r'^banner:\s*"(/images/projects/([A-Za-z0-9._-]+?)(?:@\d+)?\.avif)"\s*$', re.M)
BANNER_SRCSET_FIELD = re.compile(r'^bannerSrcset:.*\n', re.M)


def dims(path):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
         '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', str(path)],
        capture_output=True, text=True).stdout.strip()
    w, h = out.split('x')
    return int(w), int(h)


def find_source(stem):
    for suffix in SOURCE_SUFFIXES:
        candidate = SOURCES / (stem + suffix)
        if candidate.exists():
            return candidate
    return None


def emit(source, stem, widths):
    """Write <stem>@<w>.avif for each width the source can actually fill.

    A width above the source width is skipped rather than upscaled.
    """
    src_w, src_h = dims(source)
    kept, skipped = [], []
    for w in widths:
        if w > src_w:
            skipped.append(w)
            continue
        out = IMAGES / ('%s@%d.avif' % (stem, w))
        if WRITE:
            r = subprocess.run(
                ['sips', '-s', 'format', 'avif', '-s', 'formatOptions', '72',
                 '--resampleWidth', str(w), str(source), '--out', str(out)],
                capture_output=True, text=True)
            if r.returncode:
                sys.exit('sips failed on %s at %dpx\n%s' % (stem, w, r.stderr[-500:]))
        kept.append(w)
    return kept, skipped, src_w, src_h


def srcset_for(stem, widths):
    return ', '.join('/images/projects/%s@%d.avif %dw' % (stem, w, w) for w in widths)


def set_attr(tag, name, value):
    """Replace an attribute if present, otherwise add it just before the closing slash."""
    pattern = re.compile(r'\s%s="[^"]*"' % re.escape(name))
    if pattern.search(tag):
        return pattern.sub(' %s="%s"' % (name, value), tag, count=1)
    return re.sub(r'\s*/?>$', ' %s="%s" />' % (name, value), tag, count=1)


def report(rows):
    if not rows:
        return
    print('%-22s %-9s %8s  %s' % ('image', 'ladder', 'source', 'result'))
    for stem, kind, src, result in rows:
        print('%-22s %-9s %8s  %s' % (stem, kind or '(pane)', src, result))
    print()


def main():
    if not SOURCES.exists():
        print('No source folder at %s.' % SOURCES)
        print('Drop the full resolution shots there, named after the stem they replace,')
        print('for example car-guys-2.png, then run this again.')
        return 0

    done, waiting, short = [], [], []

    for md in sorted(CONTENT.glob('*.md')):
        if md.name.startswith('_'):
            continue
        text = original = md.read_text()

        # --- the body images -------------------------------------------------
        def rewrite(match):
            tag = match.group(0)
            src = SRC_ATTR.search(tag)
            if not src:
                return tag
            stem = src.group(1)
            classes = CLASS_ATTR.search(tag)
            kind = ''
            if classes:
                for name in classes.group(1).split():
                    if name in LADDERS:
                        kind = name
            widths, sizes = LADDERS[kind]

            source = find_source(stem)
            if source is None:
                waiting.append((stem, kind, '-', 'no source yet, left as it is'))
                return tag

            kept, skipped, src_w, src_h = emit(source, stem, widths)
            if not kept:
                waiting.append((stem, kind, '%dpx' % src_w,
                                'source narrower than every rung'))
                return tag
            if skipped:
                short.append((stem, kind, '%dpx' % src_w,
                              'short of %s' % ', '.join('%dpx' % w for w in skipped)))
            else:
                done.append((stem, kind, '%dpx' % src_w,
                             'wrote %s' % ', '.join('@%d' % w for w in kept)))

            # `src` is the fallback for anything that does not understand srcset, and
            # every browser that matters does, so it points at the smallest rung rather
            # than the largest. A crawler or an old client gets a light file, not an 80KB
            # one it has no use for.
            base = kept[0]
            tag = set_attr(tag, 'src', '/images/projects/%s@%d.avif' % (stem, base))
            tag = set_attr(tag, 'srcset', srcset_for(stem, kept))
            tag = set_attr(tag, 'sizes', sizes)
            tag = set_attr(tag, 'width', str(base))
            tag = set_attr(tag, 'height', str(round(base * src_h / src_w)))
            return tag

        text = IMG_TAG.sub(rewrite, text)

        # --- the banner in frontmatter ---------------------------------------
        banner = BANNER_FIELD.search(text)
        if banner:
            stem = banner.group(2)
            source = find_source(stem)
            if source is None:
                waiting.append((stem, 'banner', '-', 'no source yet, left as it is'))
            else:
                kept, skipped, src_w, src_h = emit(source, stem, BANNER_LADDER[0])
                if kept:
                    if skipped:
                        short.append((stem, 'banner', '%dpx' % src_w,
                                      'short of %s' % ', '.join('%dpx' % w for w in skipped)))
                    else:
                        done.append((stem, 'banner', '%dpx' % src_w,
                                     'wrote %s' % ', '.join('@%d' % w for w in kept)))
                    line = 'banner: "/images/projects/%s@%d.avif"' % (stem, kept[0])
                    text = BANNER_FIELD.sub(line, text, count=1)
                    text = BANNER_SRCSET_FIELD.sub('', text)
                    text = text.replace(
                        line, line + '\nbannerSrcset: "%s"' % srcset_for(stem, kept), 1)

        if text != original and WRITE:
            md.write_text(text)

    report(done)
    if short:
        print('These ran but could not reach the top of their ladder. A wider export is')
        print('the only fix, because upscaling here would put the blur back:')
        report(short)
    if waiting:
        print('Waiting on a source file in assets/project-shots. Nothing changed for these:')
        report(waiting)

    if not WRITE:
        print('Report only. Nothing was written. Pass --write to generate and rewrite.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
