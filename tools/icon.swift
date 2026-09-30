// Compose a square app icon: a rounded tile in a brand colour with a mark centred on it.
//
//   swift tools/icon.swift mark.png out.png 256 "#FFFFFF" 56 0.18
//                          mark    out      size bg        radius inset
//
// Pass "none" as the background to keep the mark's own transparency and skip the tile,
// which is right when the mark already arrives as a full bleed square, the way a webclip
// does. inset is the fraction of the size to leave clear on each side.
//
// This exists because the case study sidebar icons were flat coloured squares with no
// brand on them at all. The marks themselves come from each client's own published icon,
// their favicon or webclip, rather than being redrawn.
import Foundation
import AppKit

let a = CommandLine.arguments
guard a.count >= 4 else {
    print("usage: icon.swift mark.png out.png size [bgHex|none] [radius] [inset]")
    exit(64)
}
let markPath = a[1], outPath = a[2]
let size = Int(a[3]) ?? 256
let bgArg = a.count > 4 ? a[4] : "none"
let radius = a.count > 5 ? CGFloat(Double(a[5]) ?? 0) : CGFloat(size) * 0.22
let inset = a.count > 6 ? CGFloat(Double(a[6]) ?? 0) : 0

func colorFrom(_ hex: String) -> NSColor? {
    let s = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
    guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
    return NSColor(srgbRed: CGFloat((v >> 16) & 0xff) / 255.0,
                   green: CGFloat((v >> 8) & 0xff) / 255.0,
                   blue: CGFloat(v & 0xff) / 255.0, alpha: 1)
}

guard let mark = NSImage(contentsOfFile: markPath) else {
    print("could not read \(markPath)"); exit(1)
}

let px = size
guard let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px,
                                 bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
                                 isPlanar: false, colorSpaceName: .deviceRGB,
                                 bytesPerRow: px * 4, bitsPerPixel: 32) else {
    print("no bitmap"); exit(2)
}
rep.size = NSSize(width: px, height: px)

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSGraphicsContext.current?.imageInterpolation = .high

let full = NSRect(x: 0, y: 0, width: px, height: px)
if bgArg.lowercased() != "none", let bg = colorFrom(bgArg) {
    let path = NSBezierPath(roundedRect: full, xRadius: radius, yRadius: radius)
    bg.setFill()
    path.fill()
}

// Fit the mark inside the inset box, keeping its aspect ratio.
let pad = CGFloat(px) * inset
let box = full.insetBy(dx: pad, dy: pad)
let ms = mark.size
let scale = min(box.width / ms.width, box.height / ms.height)
let drawn = NSRect(x: box.midX - ms.width * scale / 2,
                   y: box.midY - ms.height * scale / 2,
                   width: ms.width * scale, height: ms.height * scale)
mark.draw(in: drawn, from: .zero, operation: .sourceOver, fraction: 1.0)

NSGraphicsContext.restoreGraphicsState()

if let data = rep.representation(using: .png, properties: [:]) {
    try? data.write(to: URL(fileURLWithPath: outPath))
    print("\(outPath)  \(px)x\(px)")
} else {
    print("write failed"); exit(3)
}
