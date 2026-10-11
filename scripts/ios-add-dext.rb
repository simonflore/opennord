# Adds the Nord USB driver (DriverKit DEXT) to the Capacitor-generated Xcode
# project and sets the app up to talk to it. `npx cap add ios` knows nothing
# about driver extensions, so this is what turns its stock project into ours.
#
# ios/ is committed with this already applied; run it again only after
# regenerating the project (`rm -rf ios && npx cap add ios`). Idempotent.
#
# Needs the `xcodeproj` gem. CocoaPods ships one:
#   GEM_PATH="$(brew --prefix cocoapods)/libexec" ruby scripts/ios-add-dext.rb
require 'xcodeproj'

PROJECT = 'ios/App/App.xcodeproj'
DEXT_NAME = 'NordUsbDriver'
# Relative to ios/App: the DEXT's sources live with the plugin they belong to.
DEXT_DIR = '../../plugins/capacitor-nord-usb/ios/Dext'
DEXT_SOURCES = %w[NordUsbDriver.iig NordUsbDriver.cpp NordUsbUserClient.iig NordUsbUserClient.cpp].freeze
APP_ENTITLEMENTS = 'App/App.entitlements'
# DriverKit reached iPad with iPadOS 16 (DriverKit 22), so that is the floor for both.
IOS_TARGET = '16.0'
DRIVERKIT_TARGET = '22.0'

project = Xcodeproj::Project.open(PROJECT)
app = project.targets.find { |t| t.name == 'App' } or abort "#{PROJECT}: no App target"
app_id = app.build_configurations.first.build_settings['PRODUCT_BUNDLE_IDENTIFIER']

# --- the app -----------------------------------------------------------------
project.build_configurations.each { |c| c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = IOS_TARGET }
app.build_configurations.each do |c|
  s = c.build_settings
  s['IPHONEOS_DEPLOYMENT_TARGET'] = IOS_TARGET
  s['TARGETED_DEVICE_FAMILY'] = '2' # iPad only: there is no DriverKit on iPhone
  s['CODE_SIGN_ENTITLEMENTS'] = APP_ENTITLEMENTS
end
app_group = project.main_group['App']
app_group.new_file('App.entitlements') unless app_group.files.any? { |f| f.path == 'App.entitlements' }

# --- the driver --------------------------------------------------------------
dext = project.targets.find { |t| t.name == DEXT_NAME }
unless dext
  dext = project.new(Xcodeproj::Project::Object::PBXNativeTarget)
  project.targets << dext
  dext.name = DEXT_NAME
  dext.product_name = DEXT_NAME
  dext.product_type = 'com.apple.product-type.driver-extension'
  dext.build_configuration_list = Xcodeproj::Project::ProjectHelper.configuration_list(project, :osx, nil, nil, :objc)
  dext.build_phases << project.new(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
  dext.build_phases << project.new(Xcodeproj::Project::Object::PBXFrameworksBuildPhase)

  product = project.products_group.new_reference("#{app_id}.#{DEXT_NAME}.dext", :built_products)
  product.include_in_index = '0'
  product.explicit_file_type = 'wrapper.driver-extension'
  dext.product_reference = product

  group = project.main_group.new_group(DEXT_NAME, DEXT_DIR)
  DEXT_SOURCES.each do |name|
    ref = group.new_file(name)
    ref.last_known_file_type = 'sourcecode.iig' if name.end_with?('.iig')
    dext.source_build_phase.add_file_reference(ref)
  end
  group.new_file('Info.plist')
  group.new_file("#{DEXT_NAME}.entitlements")

  frameworks = project.frameworks_group
  %w[DriverKit USBDriverKit].each do |fw|
    ref = frameworks.new_reference("System/Library/Frameworks/#{fw}.framework", :sdk_root)
    ref.name = "#{fw}.framework"
    dext.frameworks_build_phase.add_file_reference(ref)
  end
end

app_settings = app.build_configurations.first.build_settings
dext.build_configurations.each do |c|
  c.build_settings.replace(
    'SDKROOT' => 'driverkit',
    'DRIVERKIT_DEPLOYMENT_TARGET' => DRIVERKIT_TARGET,
    'PRODUCT_BUNDLE_IDENTIFIER' => "#{app_id}.#{DEXT_NAME}",
    # A DEXT's bundle is named after its bundle id.
    'PRODUCT_NAME' => '$(PRODUCT_BUNDLE_IDENTIFIER)',
    'INFOPLIST_FILE' => "#{DEXT_DIR}/Info.plist",
    'CODE_SIGN_ENTITLEMENTS' => "#{DEXT_DIR}/#{DEXT_NAME}.entitlements",
    'CODE_SIGN_STYLE' => 'Automatic',
    # App Store Connect rejects an extension whose version differs from its app's.
    'MARKETING_VERSION' => app_settings['MARKETING_VERSION'],
    'CURRENT_PROJECT_VERSION' => app_settings['CURRENT_PROJECT_VERSION'],
    'CLANG_CXX_LANGUAGE_STANDARD' => 'gnu++20',
    'SKIP_INSTALL' => 'YES',
  )
end

# --- embed the driver in the app --------------------------------------------
app.add_dependency(dext) unless app.dependencies.any? { |d| d.target == dext }
embed = app.copy_files_build_phases.find { |p| p.name == 'Embed System Extensions' }
unless embed
  embed = app.new_copy_files_build_phase('Embed System Extensions')
  embed.dst_subfolder_spec = '16' # Products Directory
  embed.dst_path = '$(SYSTEM_EXTENSIONS_FOLDER_PATH)'
  build_file = embed.add_file_reference(dext.product_reference)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
end

project.save
puts "[ios-add-dext] #{DEXT_NAME} is in #{PROJECT} (bundle id #{app_id}.#{DEXT_NAME})"
