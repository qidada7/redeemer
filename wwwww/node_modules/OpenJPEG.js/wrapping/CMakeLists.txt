# wrapping
if(BUILD_JAVA)
  add_subdirectory(java)
endif()

if(BUILD_JS)
  add_subdirectory(JS)
endif()

if(BUILD_NATIVEDEBUG)
  add_subdirectory(nativedebug)
endif()
