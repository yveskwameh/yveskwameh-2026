Tech-stack logos, exported from Figma (file KW7d1znFyENwl2OkG9T7FF, node 78-23) at 224x224.

Current set: claude-code, codex, figma, webflow, visual-studio-code, higgsfield.
Each is a full-bleed app tile with its own rounded corner (rx=53, so 23.7% of the box).
Dock order lives in src/data/dock.ts.

These are inlined into the page at build time by src/components/os/StackIcon.astro.
They sit in src/ and not public/ on purpose: public/ is copied straight into dist/ and
uploaded, so keeping them there would ship a second copy that nothing ever requests.

Re-exporting from Figma:
- Export the frame as SVG at 224x224.
- Figma paints the artboard background as the first <rect>, the one without an rx.
  Delete it, or run it through the same clean step, otherwise you get a grey square
  behind the tile. The tile itself is the rect that has rx, leave that alone.
- Drop width/height from the root <svg> but keep viewBox, so it scales to any size.
- Ids do not need cleaning. StackIcon namespaces them per icon at build time, because
  every Figma export reuses the same "clip0_78_23" and they would collide once inlined.
