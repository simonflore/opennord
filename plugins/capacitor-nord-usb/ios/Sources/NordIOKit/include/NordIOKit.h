// The iOS SDK ships IOKit's headers without a module map, so Swift can't
// `import IOKit` there. This target re-exports the user-client API the Nord USB
// plugin needs (IOServiceOpen, IOConnectCallMethod, …) as the NordIOKit module.
#ifndef NordIOKit_h
#define NordIOKit_h

#include <IOKit/IOKitLib.h>

#endif /* NordIOKit_h */
