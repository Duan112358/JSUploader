JSUploader
==========

Cross site image uploader and image compression supported

### Client side dependents:
1.  Jquery or Zepto

>   Client side image compression algorithm use [ImageCompress.js](https://github.com/Lzccug/ImageCompression), thanks [Lzccug](https://github.com/Lzccug)

>   Note: the image compressed as BASE64 string, and replace placeholder char `=` with `_`, so remember to convert it back in server side,
>       the details is [index.py](https://github.com/Duan112358/JSUploader/blob/master/index.py)
### Server side :
1. Web.py

>   server side demo host by [Web.py](http://webpy.org)


