function encode(options) {
  var openJPEG;
  if(options.dynamic) {
    openJPEG = require('./openJPEG-DynamicMemory-commonJS.js');
  } else {
    openJPEG = require('./openJPEG-FixedMemory-commonJS.js');
  }
  var width = options.width;
  var height = options.height;
  var bpp = options.bpp || 8;
  var quality = options.quality || 0;
  var rate = options.rate || 0;
  var pixels = options.pixels;
  var iccProfile = options.iccProfile;

  if(!width || !height || !pixels) {
    return null;
  }

  var pixelsPtr = openJPEG._malloc(pixels.length);
  openJPEG.writeArrayToMemory(pixels, pixelsPtr);

  var iccProfilePtr;
  var iccProfileLength = 0;
  if(iccProfile && (iccProfile.length > 0)) {
    iccProfilePtr = openJPEG._malloc(iccProfile.length);
    openJPEG.writeArrayToMemory(iccProfile, iccProfilePtr);
    iccProfileLength = iccProfile.length;
  } else {
    iccProfilePtr = openJPEG._malloc(4); // Not used
  }

  var outPtrPtr = openJPEG._malloc(4);
  var outLenPtr = openJPEG._malloc(4);

  // jp2_encode(int width, int height, int bpp, void * pixels, void * icc, int iccLen, void ** out, int * outLen)
  var ret = openJPEG.ccall('jp2_encode','number', ['number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
    [width, height, bpp, quality, rate, pixelsPtr, iccProfilePtr, iccProfileLength, outPtrPtr, outLenPtr]);
  if(ret == 0) {
    console.log('[opj_encode] decoding failed!')
    openJPEG._free(pixelsPtr);
    openJPEG._free(openJPEG.getValue(outPtrPtr, '*'));
    openJPEG._free(iccProfilePtr);
    openJPEG._free(outLenPtr);
    return null;
  }

  var outLen = openJPEG.getValue(outLenPtr, 'i32');
  var outLenPtr = openJPEG.getValue(outPtrPtr, '*');
  var compressedData = Buffer.from(openJPEG.HEAP32.buffer, outLenPtr, outLen);

  openJPEG._free(pixelsPtr);
  openJPEG._free(openJPEG.getValue(outPtrPtr, '*'));
  openJPEG._free(iccProfilePtr);
  openJPEG._free(outLenPtr);
  return compressedData;
}

module.exports = {
  encode: encode
};
