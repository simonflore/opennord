// swift-tools-version: 5.9
import PackageDescription

// The app half only. The DriverKit DEXT (ios/Dext) is its own Xcode target in
// ios/App — SwiftPM can't build a driver extension.
let package = Package(
  name: "CapacitorNordUsb",
  platforms: [.iOS(.v16)],
  products: [
    .library(name: "CapacitorNordUsb", targets: ["NordUsbPlugin"]),
  ],
  dependencies: [
    .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
  ],
  targets: [
    .target(
      name: "NordIOKit",
      path: "ios/Sources/NordIOKit",
      linkerSettings: [.linkedFramework("IOKit")]
    ),
    .target(
      name: "NordUsbPlugin",
      dependencies: [
        "NordIOKit",
        .product(name: "Capacitor", package: "capacitor-swift-pm"),
        .product(name: "Cordova", package: "capacitor-swift-pm"),
      ],
      path: "ios/Sources/NordUsbPlugin"
    ),
  ]
)
