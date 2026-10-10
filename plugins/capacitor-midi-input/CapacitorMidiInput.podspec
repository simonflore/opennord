# UNVALIDATED — needs an Xcode build of the generated ios/ target plus an iPad and
# a USB or Bluetooth MIDI keyboard to run/validate.
Pod::Spec.new do |s|
  s.name = 'CapacitorMidiInput'
  s.version = '0.0.1'
  s.summary = 'MIDI keyboard input on iPad via CoreMIDI (USB, Bluetooth, network).'
  s.license = 'AGPL-3.0-or-later'
  s.homepage = 'https://github.com/simonflore/opennord'
  s.author = 'OpenNord'
  s.source = { :git => 'https://github.com/simonflore/opennord.git', :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m}'
  s.ios.deployment_target = '14.0'
  s.frameworks = 'CoreMIDI', 'CoreAudioKit'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
