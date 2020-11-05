#!/bin/bash
mkdir build
emcc bin/libopenjpeg-js.bc -o \
     build/openJPEG-FixedMemory-browser.js \
     --memory-init-file 0 \
     -s EXPORTED_FUNCTIONS="['_jp2_decode','_jp2_encode']" \
     -s EXTRA_EXPORTED_RUNTIME_METHODS="['writeArrayToMemory','ccall','getValue']" \
     -s TOTAL_MEMORY=1073741824 \
     -s NO_FILESYSTEM=1 \
     -s EXPORT_NAME="'OpenJPEG'" \
     -s MODULARIZE=1 \
     -O3
emcc bin/libopenjpeg-js.bc -o \
     build/openJPEG-DynamicMemory-browser.js \
     --memory-init-file 0 \
     -s EXPORTED_FUNCTIONS="['_jp2_decode','_jp2_encode']" \
     -s EXTRA_EXPORTED_RUNTIME_METHODS="['writeArrayToMemory','ccall','getValue']" \
     -s ALLOW_MEMORY_GROWTH=1 \
     -s NO_FILESYSTEM=1 \
     -s EXPORT_NAME="'OpenJPEG'" \
     -s MODULARIZE=1 \
     -O3
emcc bin/libopenjpeg-js.bc \
     -o build/openJPEG-FixedMemory-commonJS.js \
     --memory-init-file 0 \
     -s EXPORTED_FUNCTIONS="['_jp2_decode','_jp2_encode']" \
     -s EXTRA_EXPORTED_RUNTIME_METHODS="['writeArrayToMemory','ccall','getValue']" \
     -s TOTAL_MEMORY=1073741824 \
     -s NO_FILESYSTEM=1 \
     -s DISABLE_EXCEPTION_CATCHING=0 \
     -O3
emcc bin/libopenjpeg-js.bc \
     -o build/openJPEG-DynamicMemory-commonJS.js \
     --memory-init-file 0 \
     -s EXPORTED_FUNCTIONS="['_jp2_decode','_jp2_encode']" \
     -s EXTRA_EXPORTED_RUNTIME_METHODS="['writeArrayToMemory','ccall','getValue']" \
     -s ALLOW_MEMORY_GROWTH=1 \
     -s NO_FILESYSTEM=1 \
     -s DISABLE_EXCEPTION_CATCHING=0 \
     -O3
