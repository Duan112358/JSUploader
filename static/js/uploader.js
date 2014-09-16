(function(EXIF) {
    'use sttict';

    function hasClass(el, className) {
        if (!className) return false;
        if (el.classList) {
            return el.classList.contains(className);
        } else {
            return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        }
    }

    function addClass(el, className) {
        if (!className) return;
        if (el.classList) {
            el.classList.add(className);
        } else {
            el.className += ' ' + className;
        }
    }

    function removeClass(el, className) {
        if (!className) return;
        if (el.classList) {
            el.classList.remove(className);
        } else {
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    function createElement(type, attrs, csss) {
        var elem = document.createElement(type);
        if (!!attrs) {
            for (var attr in attrs) {
                elem.setAttribute(attr, attrs[attr]);
            }
        }
        if (!!csss) {
            for (var css in csss) {
                elem.style[css] = csss[css];
            }
        }

        return elem;
    }

    var Uploader = {},
        _options;

    Uploader.init = function(options) {
        _options = options || {};
        _options._cache = {};
        //specify by ID will be more GOOD.
        _options._target = document.querySelectorAll(options.target) || document.querySelector('input[type=file]');

        if (!_options._target) {
            console.error('no file input field error.');
            return;
        }

        _options.imgfield = options.imgfield || 'img';
        _options.action = options.action || location.href;
        _options.params = options.params || {};
        _options.domain = options.domain || false;
        _options._callback_prefix = 'uploader_handler_';
        _options._fileinput_prefix = 'fileinput_';
        _options.complete = options.complete || function() {};
        _options.cancel = options.cancel || function() {};

        if (_options._target.length > 1) {
            for (var _id = 0, _count = _options._target.length, _target; _id < _count; _id++) {
                _target = _options._target[_id];
                bindTarget(_target);
            }
        } else {
            if (_options._target.length == 0)
                return;
            bindTarget(_options._target);
        }
    }

    function bindTarget(target) {
        var inputid = Date.now().toString();
        var fileinput;
        target.setAttribute('data-inputid', inputid);
        target.setAttribute('data-background-image', target.style.backgroundImage);
        target.style.position = 'relative';

        target.removeEventListener('click');
        target.addEventListener('click', function() {
            if (target.getAttribute('disabled')) {
                target.removeAttr('disabled');
                target.style.backgroundImage = 'url("' + target.getAttribute('data-background-image') + '")';
                target.innerHTML = "";
                _options.cancel.call(target);
                return false;
            }
            if (target.getAttribute('data-inited')) {
                fileinput = _options._cache['fileinput_' + inputid];
            } else {
                fileinput = createElement('input', {
                    'type': 'file',
                    'accept': 'image/*',
                    'className': 'dh_uploader',
                    'id': 'fileinput_' + inputid
                }, {
                    'display': 'none'
                });

                _options._cache['fileinput_' + inputid] = fileinput;
                target.setAttribute('data-inited', true);
            }
            fileinput.removeEventListener('change');
            fileinput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (file) {
                    addClass(target, 'round');
                    var form = initUploadForm(target);
                    previewImage(form, file);
                }
            }, false);
            document.body.appendChild(fileinput);
            fileinput.click();
        }, false);
    }


    function bindUploadedHandler(target) {
        var frameid = target.getAttribute('data-inputid');
        var callback_prefix = _options._callback_prefix;
        var iframe = createElement('iframe', {
            'id': frameid,
            'name': frameid,
        }, {
            'display': 'none'
        });
        document.body.appendChild(iframe);

        if (_options.domain) {
            window.domain = _options.domain;
        }

        window.parent[callback_prefix + frameid] = function(data) {
            var iframe = document.getElementById(frameid);
            if (iframe) {
                document.body.removeChild(iframe);
            }
            _options._cache['fileinput_' + frameid].setAttribute('value', '');

            removeClass(target, 'round');
            target.append(createElement('span', null, {
                'className': 'close'
            }));
            _options.complete.apply(target, data);
            delete window[callback_prefix + frameid];
        };
    }

    function initUploadForm(target) {
        var frameid = target.getAttribute('data-inputid');
        var params = _options.params;
        var form = createElement('form', {
            'method': 'post',
            'enctype': 'multipart/form-data',
            'target': frameid,
            'id': frameid,
            'action': _options.action
        });

        target.setAttribute('disabled', true);

        for (var prop in params) {
            if (params.hasOwnProperty(prop)) {
                form.appendChild(createElement('input', {
                    'type': 'hidden',
                    'name': prop,
                    'value': params[prop]
                }));
            }
        }

        form.appendChild(createElement('input', {
            'type': 'hidden',
            'name': 'format',
            'value': 'scripts'
        }));
        form.appendChild(createElement('input', {
            'type': 'hidden',
            'name': 'csrf_token',
            'value': '$csrf_token()'
        }));
        form.appendChild(createElement('input', {
            'type': 'hidden',
            'name': 'callback',
            'value': _options._callback_prefix + frameid
        }));

        bindUploadedHandler(target);
        return form;
    }

    function previewImage(form, file) {
        if (window.FileReader) {
            var reader = new window.FileReader(),
                hideCanvas = document.createElement('canvas'),
                WIDTH = 620;

            reader.onload = function(event) {
                var urlStr = event.target.result;
                //process android device without base64 head issuse
                if (urlStr.substring(5, 10) != "image") {
                    urlStr = urlStr.replace(/(.{5})/, "$1image/jpeg;");
                }

                // only compress image > 100kb
                if (hideCanvas.getContext && urlStr.length > 1024 * 100) {
                    var hideContext = hideCanvas.getContext('2d');
                    var image = new Image();

                    image.src = urlStr;
                    image.onload = function() {
                        var upimgHeight = image.height,
                            upimgWidth = image.width,
                            HEIGHT = WIDTH * upimgHeight / upimgWidth,
                            orientation = 1;

                        //get image orientation
                        EXIF.getData(image, function() {
                            orientation = parseInt(EXIF.getTag(image, 'Orientation')) || 1;
                        });

                        hideCanvas.setAttribute("height", HEIGHT);
                        hideCanvas.setAttribute("width", WIDTH);
                        if (orientation == 3 || orientation == 4) {
                            hideContext.rotate(180 * Math.PI / 180);
                        } else if (orientation == 5 && orientation == 6) {
                            hideContext.translate(HEIGHT, 0);
                            hideContext.rotate(90 * Math.PI / 180);
                        } else if (orientation == 7 || orientation == 8) {
                            hideContext.translate(0, WIDTH);
                            hideContext.rotate(270 * Math.PI / 180);
                        }

                        drawImageIOSFix(hideContext, image, 0, 0, upimgWidth, upimgHeight, 0, 0, WIDTH, HEIGHT);
                        urlStr = hideCanvas.toDataURL('image/jpeg');

                    }
                }

                var filestr = urlStr.replace('=', '_');
                form.appendChild(createElement('input', {
                    'type': 'hidden',
                    'name': _options.imgfield,
                    'value': filestr
                }));
                form.removeEventListener('submit');
                form.addEventListener('submit', function(e) {
                    e.stopPropagation();
                });
                form.submit();
            }

            reader.readAsDataURL(file);
        }
    }

    function detectVerticalSquash(img) {
        var imgwidth = img.naturalWidth,
            imgheight = img.naturalHeight,
            canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = imgheight;
        var canvasContext = canvas.getContext('2d');
        canvasContext.drawImage(img, 0, 0);
        var data = canvasContext.getImageData(0, 0, 1, imgheight).data;
        //search image edge pixel position in case it is squashed vertically
        var sy = 0,
            ey = imgheight,
            py = imgheight;
        while (py > sy) {
            var alpha = data[(py - 1) * 4 + 3];
            if (alpha == 0) {
                ey = py;
            } else {
                sy = py;
            }

            py = (ey + sy) >> 1;
        }
        return (py / imgheight) || 1;
    }

    function drawImageIOSFix(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
        var ratio = detectVerticalSquash(img);
        // Workd only if while imag is displayed
        ctx.drawImage(img, sx * ratio, sy * ratio, sw * ratio, sh * ratio, dx, dy, dw, dh);
    }

    window.Uploader = Uploader;
})(EXIF);
