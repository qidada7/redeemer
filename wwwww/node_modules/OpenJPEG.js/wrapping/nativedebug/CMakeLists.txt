# First thing define the common source:
set(nativedebug_SRCS
  nativedebug.c
  )

# required header file:
include_directories(
  ${OPENJPEG_BINARY_DIR}/src/lib/openjp2 # opj_config.h
  ${OPENJPEG_SOURCE_DIR}/src/lib/openjp2
  ${OPENJPEG_SOURCE_DIR}/src/bin/common
  ${OPENJPEG_SOURCE_DIR}/src/bin/jp2
  )

add_executable(nativedebug
  ${nativedebug_SRCS}
  )

target_link_libraries(nativedebug openjp2)
