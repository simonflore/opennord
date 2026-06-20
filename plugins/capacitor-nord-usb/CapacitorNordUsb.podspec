# UNVALIDATED — needs com.apple.developer.driverkit entitlement + M1+ iPad + Nord
# Stage 4 to sign/run/validate (docs/IPAD.md). The DEXT (ios/Dext) is a separate
# Xcode target added during `cap add ios`, not compiled by this pod.
Pod::Spec.new do |s|
  s.name = 'CapacitorNordUsb'
  s.version = '0.0.1'
  s.summary = 'Nord vendor-USB transfer via a DriverKit DEXT (iPad M1+).'
  s.license = 'AGPL-3.0-or-later'
  s.homepage = 'https://github.com/simonflore/opennord'
  s.author = 'OpenNord'
  s.source = { :git => 'https://github.com/simonflore/opennord.git', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m}'
  s.ios.deployment_target = '14.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
