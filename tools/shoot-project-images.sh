#!/bin/zsh
# Capture every case study screenshot that can be captured, at the resolution the srcset
# ladder wants. Output is written straight into assets/project-shots under the name the
# markdown uses, so the whole pipeline is:
#
#   npm run build
#   zsh tools/shoot-project-images.sh
#   python3 tools/project-images.py --write
#
# The window and the iframe are sized separately on purpose. See the note at the top of
# tools/shot-frame.html: Chrome headless clamps its window to about 500px wide and then
# takes the screenshot at the width you asked for anyway, so a 393px phone shot comes out
# as a 500px layout with the right hand side missing. Every phone shot on this site was
# wrong that way until somebody measured it instead of looking at it.
#
# What is not here, and why: the Car Guys wireframes and its waitlist page are Figma frames
# and a page that is no longer live, and every shot for Tem's, Altabrio and BOH comes from
# screen recordings. None of those can be re-captured from a URL. project-images.py names
# them on every run so the gap stays visible.
set -e

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT="${0:A:h:h}"
OUT="$ROOT/assets/project-shots"
mkdir -p "$OUT"

if [[ ! -f "$ROOT/dist/index.html" ]]; then
  echo "dist/index.html is missing. Run npm run build first."
  exit 1
fi

cp "$ROOT/tools/shot-frame.html" "$ROOT/dist/shot-frame.html"
cd "$ROOT/dist"
python3 -m http.server 4399 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null; rm -f "$ROOT/dist/shot-frame.html"' EXIT
sleep 2

B="http://127.0.0.1:4399/shot-frame.html"

# shot <stem> <src> <cssW> <cssH> <scale> <keepDeviceH|0> [extraQuery]
shot () {
  local stem=$1 src=$2 w=$3 h=$4 sc=$5 keep=$6 extra=$7
  # The window never goes below 500 wide, because Chrome clamps it there and then lies
  # about it. Anything narrower is captured wide and cropped back.
  local winw=$w
  [[ $winw -lt 500 ]] && winw=500
  local outh=$((h * sc))
  [[ $keep -gt 0 ]] && outh=$keep

  perl -e 'alarm 180; exec @ARGV' "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=$sc --window-size=$winw,$h --virtual-time-budget=30000 \
    --screenshot="$OUT/$stem-raw.png" \
    "$B?src=$src&w=$w&h=$h&$extra" >/dev/null 2>&1

  # From the top left. sips -c crops from the centre, which is not what any of this wants.
  swift "$ROOT/tools/crop.swift" "$OUT/$stem-raw.png" "$OUT/$stem.png" 0 0 $((w * sc)) $outh >/dev/null
  rm -f "$OUT/$stem-raw.png"
  echo -n "$stem  "
  sips -g pixelWidth -g pixelHeight "$OUT/$stem.png" 2>/dev/null | tail -2 | tr -d ' \n'
  echo ""
}

# ---- Yves Desktop, from its own build --------------------------------------
# 1440x900 is already 16:10, so those need no crop. The portrait shots keep the ratios the
# markdown declares: 3:4 for the tablet, 1:2 for the phone.
shot yves-desktop-1  "/" 1440 900  2 0    "open=images"
shot yves-desktop-2  "/" 1440 900  2 0    "lock=1"
shot yves-desktop-3  "/" 1440 900  2 0    ""
shot yves-desktop-4  "/" 1440 900  2 0    "open=projects"
shot yves-desktop-5  "/" 1440 900  2 0    "open=about"
shot yves-desktop-6  "/" 1440 900  2 0    "open=services"
shot yves-desktop-7  "/" 1440 900  2 0    "open=game"
shot yves-desktop-8  "/" 1440 900  2 0    "open=testimonials"
shot yves-desktop-9  "/" 768  1100 2 2048 ""
shot yves-desktop-10 "/" 393  850  3 2358 ""
shot yves-desktop-11 "/" 393  850  3 2358 "open=projects"

# ---- The live client sites. Cross origin, so there is nothing to drive, the page only
#      has to render.
CG_HOME="https%3A%2F%2Fthecarguysinc.com%2F"
CG_BUY="https%3A%2F%2Fthecarguysinc.com%2Fbuy-or-lease-new-car"
CG_SELL="https%3A%2F%2Fthecarguysinc.com%2Fsell-my-car"
CG_EXIT="https%3A%2F%2Fthecarguysinc.com%2Fexit-my-lease-or-finance"
SH_HOME="https%3A%2F%2Fscrollhousestudio.com%2F"

shot car-guys-1   "$CG_HOME" 1440 900  2 0    ""
shot car-guys-6   "$CG_BUY"  1440 900  2 0    ""
shot car-guys-7   "$CG_SELL" 1440 900  2 0    ""
shot car-guys-8   "$CG_EXIT" 1440 900  2 0    ""
shot car-guys-9   "$CG_HOME" 768  1100 2 2048 ""
shot car-guys-10  "$CG_HOME" 393  850  3 2358 ""
shot scrollhouse-6 "$SH_HOME" 393 850  3 2358 ""
