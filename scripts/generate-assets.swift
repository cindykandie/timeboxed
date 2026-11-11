// Optional macOS authoring tool; not part of the app or Android build.
// Run from the project root: swift scripts/generate-assets.swift
import AppKit

let background = NSColor(srgbRed: 11/255, green: 18/255, blue: 32/255, alpha: 1)
let accent = NSColor(srgbRed: 184/255, green: 243/255, blue: 106/255, alpha: 1)

func render(width: Int, height: Int, path: String, draw: () -> Void) throws {
    let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height,
        bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
        colorSpaceName: .deviceRGB, bytesPerRow: width * 4, bitsPerPixel: 32)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
    background.setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
    draw()
    NSGraphicsContext.restoreGraphicsState()
    try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
}

func clock(x: CGFloat, y: CGFloat, size: CGFloat) {
    accent.setStroke()
    let outline = NSBezierPath(roundedRect: NSRect(x: x, y: y, width: size, height: size),
        xRadius: size * 0.22, yRadius: size * 0.22)
    outline.lineWidth = size * 0.065
    outline.stroke()
    let hands = NSBezierPath()
    hands.move(to: NSPoint(x: x + size * 0.5, y: y + size * 0.76))
    hands.line(to: NSPoint(x: x + size * 0.5, y: y + size * 0.5))
    hands.line(to: NSPoint(x: x + size * 0.7, y: y + size * 0.4))
    hands.lineWidth = size * 0.065
    hands.lineCapStyle = .round
    hands.lineJoinStyle = .round
    hands.stroke()
}

try render(width: 512, height: 512, path: "assets/icon.png") {
    clock(x: 128, y: 128, size: 256)
}
try render(width: 320, height: 180, path: "assets/tv-banner.png") {
    clock(x: 142, y: 111, size: 36)
    let title = "TimeBoxed" as NSString
    let attributes: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: 33, weight: .bold), .foregroundColor: NSColor.white
    ]
    let size = title.size(withAttributes: attributes)
    title.draw(at: NSPoint(x: (320 - size.width) / 2, y: 52), withAttributes: attributes)
}
