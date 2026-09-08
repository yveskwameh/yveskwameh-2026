Original, full-quality source images. Nothing in here ships.

public/ is copied straight into dist/ and uploaded, so originals live here and only the
compressed version goes in public/images.

wallpaper.jpeg  1376x768, 533KB  ->  public/images/wallpaper.avif  33KB

Re-encoding after replacing a source (sips ships with macOS, no install needed):
  sips -s format avif -s formatOptions 65 src/images/wallpaper.jpeg \
       --out public/images/wallpaper.avif
Quality 65 is the sweet spot here. 55 gives 23KB with visible banding in the sky.
