// Find where a full page screenshot stops being the page and starts being empty window,
// and crop it there.
//
//   swift tools/trim.swift in.png out.png
//
// Chrome is asked for a window taller than the page so nothing is missed, which leaves a
// band of flat colour underneath. Scanning up from the bottom for the first row that is not
// one flat colour finds the real end without anybody measuring it by eye.
import Foundation
import AppKit

let a = CommandLine.arguments
guard a.count >= 3 else { print("usage: trim.swift in.png out.png"); exit(64) }
let src = a[1], dst = a[2]

guard let img = NSImage(contentsOfFile: src),
      let tiff = img.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cg = rep.cgImage else {
    print("could not read \(src)"); exit(1)
}

let w = cg.width, h = cg.height
let bytesPerRow = w * 4
var buf = [UInt8](repeating: 0, count: bytesPerRow * h)
guard let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8,
                          bytesPerRow: bytesPerRow,
                          space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
    print("no context"); exit(2)
}
ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))

// A row counts as content if any pixel differs from that row's first pixel by more than a
// hair. Flat bands, whatever colour they are, do not.
//
// Only the left half of the row is looked at. Webflow pins a "Made in Webflow" badge to the
// bottom right of every free staging site, and it is position: fixed, so in a full page
// capture it lands at the very bottom and made every scan decide the page ended at the last
// pixel. Real content spans the width, so the left half is enough to find it.
let scanTo = max(2, w / 2)
func rowHasContent(_ y: Int) -> Bool {
    let o = y * bytesPerRow
    let r0 = buf[o], g0 = buf[o + 1], b0 = buf[o + 2]
    var x = 1
    while x < scanTo {
        let p = o + x * 4
        if abs(Int(buf[p]) - Int(r0)) > 6 || abs(Int(buf[p + 1]) - Int(g0)) > 6
            || abs(Int(buf[p + 2]) - Int(b0)) > 6 { return true }
        x += 1
    }
    return false
}

// buf row 0 is the TOP of the image, because the context was drawn without flipping.
var bottom = h - 1
while bottom > 0 && !rowHasContent(bottom) { bottom -= 1 }
let keep = min(h, bottom + 24)   // a little breathing room under the last content

guard let cropped = cg.cropping(to: CGRect(x: 0, y: 0, width: w, height: keep)) else {
    print("crop failed"); exit(3)
}
let out = NSBitmapImageRep(cgImage: cropped)
if let data = out.representation(using: .png, properties: [:]) {
    try? data.write(to: URL(fileURLWithPath: dst))
    print("\(w)x\(h) -> \(w)x\(keep)")
}
