// Crop a PNG from the top left, in pixels. `sips -c` crops from the centre, which is not
// what any of the shot scripts want.
//
//   swift tools/crop.swift in.png out.png x y w h
//
import Foundation
import AppKit

let a = CommandLine.arguments
let src = a[1], dst = a[2]
let x = Int(a[3])!, y = Int(a[4])!, w = Int(a[5])!, h = Int(a[6])!

guard let img = NSImage(contentsOfFile: src),
      let tiff = img.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cg = rep.cgImage else {
    print("could not read \(src)")
    exit(1)
}
guard let cropped = cg.cropping(to: CGRect(x: x, y: y, width: w, height: h)) else {
    print("crop failed")
    exit(2)
}
let out = NSBitmapImageRep(cgImage: cropped)
if let data = out.representation(using: .png, properties: [:]) {
    try? data.write(to: URL(fileURLWithPath: dst))
    print("ok \(cropped.width)x\(cropped.height) -> \(dst)")
}
