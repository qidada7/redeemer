/*
   Copyright (c) 2016, Jean-Francois Pambrun
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
   2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
   ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
   ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#include "openjpeg.h"
#include <string.h>
#include <stdlib.h>
#ifndef EMSCRIPTEN_API
#define EMSCRIPTEN_API __attribute__((used))
#endif
#define J2K_MAGIC_NUMBER 0x51FF4FFF

//
//  Callbacks
//

static void error_callback(const char * msg, void * client_data)
{
    (void)client_data;
    printf("[ERROR] %s", msg);
}
static void warning_callback(const char * msg, void * client_data)
{
    (void)client_data;
    // printf("[WARNING] %s", msg);
}
static void info_callback(const char * msg, void * client_data)
{
    (void)client_data;
    // printf("[INFO] %s", msg);
}

//
//  API
//

EMSCRIPTEN_API int jp2_decode(void * data, int data_size, void ** p_image, int * p_image_size, int * size_x, int * size_y, int * size_comp, int * bpp, int * prec, int * sgnd, int * colorSpace)
{
    opj_dparameters_t parameters;
    opj_codec_t * l_codec = NULL;
    opj_image_t * image = NULL;
    opj_stream_t * l_stream = NULL;

    // detect stream type
    if ( ((OPJ_INT32 *)data)[0] == J2K_MAGIC_NUMBER) {
        l_codec = opj_create_decompress(OPJ_CODEC_J2K);
        // printf("OPJ_CODEC_J2K\n");
    } else {
        l_codec = opj_create_decompress(OPJ_CODEC_JP2);
        // printf("OPJ_CODEC_JP2\n");
    }

    opj_set_info_handler(l_codec, info_callback, 00);
    opj_set_warning_handler(l_codec, warning_callback, 00);
    opj_set_error_handler(l_codec, error_callback, 00);

    opj_set_default_decoder_parameters(&parameters);

    // set stream
    opj_buffer_info_t buffer_info;
    buffer_info.buf = data;
    buffer_info.cur = data;
    buffer_info.len = data_size;
    l_stream = opj_stream_create_buffer_stream(&buffer_info, OPJ_TRUE);

    /* Setup the decoder decoding parameters using user parameters */
    if (!opj_setup_decoder(l_codec, &parameters) ) {
        printf("[ERROR] opj_decompress: failed to setup the decoder\n");
        opj_stream_destroy(l_stream);
        opj_destroy_codec(l_codec);
        return 1;
    }

    /* Read the main header of the codestream and if necessary the JP2 boxes*/
    if (!opj_read_header(l_stream, l_codec, &image)) {
        printf("[ERROR] opj_decompress: failed to read the header\n");
        opj_stream_destroy(l_stream);
        opj_destroy_codec(l_codec);
        opj_image_destroy(image);
        return 1;
    }

    /* decode the image */
    if (!opj_decode(l_codec, l_stream, image)) {
        printf("[ERROR] opj_decompress: failed to decode tile!\n");
        opj_destroy_codec(l_codec);
        opj_stream_destroy(l_stream);
        opj_image_destroy(image);
        return 1;
    }

    // printf("tile %d is decoded!\n\n", parameters.tile_index);
    // printf("image X %d\n", image->x1);
    // printf("image Y %d\n", image->y1);
    // printf("image numcomps %d\n", image->numcomps);

    //printf("prec=%d, bpp=%d, sgnd=%d\n", image->comps[0].prec, image->comps[0].bpp, image->comps[0].sgnd);

    *size_x = image->x1;
    *size_y = image->y1;
    *size_comp = image->numcomps;
    *prec = image->comps[0].prec;
    *sgnd = image->comps[0].sgnd;
    *bpp = image->comps[0].bpp;
    *colorSpace = image->color_space;

    *p_image_size = (*size_x) * (*size_y) * (*size_comp) * sizeof(OPJ_INT32);
    *p_image = malloc(*p_image_size);

    if (*size_comp == 1) {
        memcpy(*p_image, image->comps[0].data, *p_image_size);
    } else if (*size_comp == 3) {
        for (int i = 0; i < (*size_x) * (*size_y); i++) {
            ((OPJ_INT32 *)*p_image)[i * 3 + 0] = image->comps[0].data[i];
            ((OPJ_INT32 *)*p_image)[i * 3 + 1] = image->comps[1].data[i];
            ((OPJ_INT32 *)*p_image)[i * 3 + 2] = image->comps[2].data[i];
        }
    }

    opj_stream_destroy(l_stream);
    opj_destroy_codec(l_codec);
    opj_image_destroy(image);
    return 0;
}

// This probably leaks memory.
EMSCRIPTEN_API int jp2_encode(int width, int height, int bpp, int quality, int rate, void * pixels, void * icc, int iccLen, void ** out, int * outLen)
{
    const OPJ_COLOR_SPACE color_space = OPJ_CLRSPC_SRGB;
    int numcomps = 4;
    int i, j;
    opj_cparameters_t parameters;
    unsigned int subsampling_dx = 1;
    unsigned int subsampling_dy = 1;
    int finalSize;

    opj_image_cmptparm_t cmptparm[4];
    opj_image_t * image;
    opj_codec_t * l_codec = 00;
    OPJ_BOOL bSuccess;
    opj_stream_t * l_stream = 00;
    opj_buffer_info_t bufferInfo;

    opj_set_default_encoder_parameters(&parameters);
    parameters.cod_format = 0;
    parameters.tcp_numlayers = 1;
    parameters.cp_disto_alloc = 1;

    if(rate != 0) {
        parameters.tcp_rates[0] = (double)rate;
        // printf("jp2_encode: rate %g\n", parameters.tcp_rates[0]);
    } else {
        if((quality == 0) || (quality == 100)) {
            // Lossless
            parameters.tcp_rates[0] = 0;  // lossless
            // printf("jp2_encode: lossless\n");
        } else {
            // Set quality
            parameters.tcp_distoratio[0] = (double)quality;
            parameters.cp_fixed_quality = OPJ_TRUE;
            // printf("jp2_encode: quality %g\n", parameters.tcp_distoratio[0]);
        }
    }

    for (i = 0; i < numcomps; i++) {
        cmptparm[i].prec = bpp;
        cmptparm[i].bpp = bpp;
        cmptparm[i].sgnd = 0;
        cmptparm[i].dx = subsampling_dx;
        cmptparm[i].dy = subsampling_dy;
        cmptparm[i].w = width;
        cmptparm[i].h = height;
    }

    image = opj_image_create(numcomps, cmptparm, color_space);
    if (!image) {
        return 0;
    }

    if (bpp == 16) {
        unsigned short *src = (unsigned short *)pixels;
        for (j = 0; j < height; ++j) {
            for (i = 0; i < width; ++i) {
                int dstOffset = i + (j * width);
                int srcOffset = 4 * dstOffset;
                image->comps[0].data[dstOffset] = src[srcOffset+0];
                image->comps[1].data[dstOffset] = src[srcOffset+1];
                image->comps[2].data[dstOffset] = src[srcOffset+2];
                image->comps[3].data[dstOffset] = src[srcOffset+3];
            }
        }
    } else {
        unsigned char *src = (unsigned char *)pixels;
        for (j = 0; j < height; ++j) {
            for (i = 0; i < width; ++i) {
                int dstOffset = i + (j * width);
                int srcOffset = 4 * dstOffset;
                image->comps[0].data[dstOffset] = src[srcOffset+0];
                image->comps[1].data[dstOffset] = src[srcOffset+1];
                image->comps[2].data[dstOffset] = src[srcOffset+2];
                image->comps[3].data[dstOffset] = src[srcOffset+3];
            }
        }
    }

    image->x0 = 0;
    image->y0 = 0;
    image->x1 = width;
    image->y1 = height;
    if(iccLen > 0) {
        image->icc_profile_buf = icc;
        image->icc_profile_len = iccLen;
    }

    /* catch events using our callbacks and give a local context */
    opj_set_info_handler(l_codec, info_callback, 00);
    opj_set_warning_handler(l_codec, warning_callback, 00);
    opj_set_error_handler(l_codec, error_callback, 00);

    l_codec = opj_create_compress(OPJ_CODEC_JP2);
    opj_set_info_handler(l_codec, info_callback, 00);
    opj_set_warning_handler(l_codec, warning_callback, 00);
    opj_set_error_handler(l_codec, error_callback, 00);

    opj_setup_encoder(l_codec, &parameters, image);

    bufferInfo.buf = malloc(64 * 1024 * 1024);
    bufferInfo.cur = bufferInfo.buf;
    bufferInfo.len = 64 * 1024 * 1024;

    l_stream = opj_stream_create_buffer_stream(&bufferInfo, OPJ_FALSE);
    if (!l_stream) {
        return 0;
    }

    bSuccess = opj_start_compress(l_codec, image, l_stream);
    if (!bSuccess) {
        opj_stream_destroy(l_stream);
        opj_destroy_codec(l_codec);
        opj_image_destroy(image);
        return 0;
    }

    bSuccess = opj_encode(l_codec, l_stream);
    if (!bSuccess) {
        opj_stream_destroy(l_stream);
        opj_destroy_codec(l_codec);
        opj_image_destroy(image);
        return 0;
    }

    bSuccess = opj_end_compress(l_codec, l_stream);
    if (!bSuccess) {
        opj_stream_destroy(l_stream);
        opj_destroy_codec(l_codec);
        opj_image_destroy(image);
        return 0;
    }

    finalSize = bufferInfo.cur - bufferInfo.buf;
    *out = malloc(finalSize);
    memcpy(*out, bufferInfo.buf, finalSize);
    *outLen = finalSize;

    opj_stream_destroy(l_stream);
    opj_destroy_codec(l_codec);
    opj_image_destroy(image);
    return 1;
}

EMSCRIPTEN_API const char * jp2_version()
{
    return opj_version();
}
