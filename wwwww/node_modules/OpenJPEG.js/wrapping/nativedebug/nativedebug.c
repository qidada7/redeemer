#define EMSCRIPTEN_API
#include "../JS/openjp2/JSOpenJPEGDecoder.c"

#include <stdio.h>

int main(int argc, char * argv[])
{
    // FILE *f;
    // size_t size;
    // int res;
    // unsigned char *data;

    // void* p_image;
    // int p_image_size;
    // int size_x;
    // int size_y;
    // int size_comp;
    // int bpp;
    // int prec;
    // int sgnd;
    // int colorSpace;

    // if(argc < 2) {
    //     return 1;
    // }

    // f = fopen(argv[1], "r");
    // fseek(f, 0, SEEK_END);
    // size = ftell(f);
    // fseek(f, 0, SEEK_SET);
    // data = malloc(size);
    // fread(data, size, 1, f);
    // fclose(f);

    // res = jp2_decode(data, size, &p_image, &p_image_size, &size_x, &size_y, &size_comp, &bpp, &prec, &sgnd, &colorSpace);

    int width = 64;
    int height = 64;
    int bpp = 16;
    int outLen = 0;
    int i, j;
    unsigned char * out;
    unsigned short * pixels = malloc(2 * width * height * 4);

    unsigned char * icc = 0;
    size_t iccLen = 0;
    FILE * f = fopen("art.icc", "rb");
    fseek(f, 0, SEEK_END);
    iccLen = ftell(f);
    fseek(f, 0, SEEK_SET);
    icc = malloc(iccLen);
    fread(icc, iccLen, 1, f);
    fclose(f);

    for (j = 0; j < height; ++j) {
        for (i = 0; i < width; ++i) {
            int offset = (4 * (i + (j * width)));
            pixels[offset+0] = 0;
            pixels[offset+1] = 0;
            pixels[offset+2] = 65535;
            pixels[offset+3] = 65535;
        }
    }

    jp2_encode(width, height, bpp, pixels, icc, iccLen, &out, &outLen);

    if (out && (outLen > 0)) {
        FILE * f = fopen("out.jp2", "wb");
        fwrite(out, outLen, 1, f);
        fclose(f);
        free(out);
    }
    return 0;
}
