(function($, EXIF){
    'use sttict';

    var Uploader = {}, _options;

    Uploader.init = function(options){
        _options = options || {};
        _options._cache = {}; 
        //specify by ID will be more GOOD.
        _options._target = $(options.target) || $('input[type=file]')[0];
        _options.imgfield = options.imgfield || 'img';
        _options.action = options.action || location.href;
        _options.params = options.params || {};
        _options.domain = options.domain || false;
        _options._callback_prefix = 'uploader_handler_';
        _options._fileinput_prefix = 'fileinput_';
        _options.complete = options.complete || function(){};
        _options.cancel = options.cancel || function(){};

        if(_options._target.length > 1){
            for(var _id=0,_count = _options._target.length, _target; _id < _count; _id++){
                _target = $(_options._target[_id]);
                bindTarget(_target);
            }
        }else{
            if(_options._target.length == 0)
                return;
            bindTarget(_options._target);
        }
    }

    function bindTarget(target){
        var inputid = Date.now().toString();
        var fileinput;      
        target.data('inputid', inputid)
            .data('background-image',target.css('background-image'))
            .css('position', 'relative');

        target.unbind('click');
        target.on('click', function(){
            if(target.attr('disabled')){
                target.removeAttr('disabled').css('background-image', target.data('background-image'))
                    .empty();
                _options.cancel.apply(target);
                return false;
            }
            if(target.data('inited')){
                fileinput = _options._cache['fileinput_' + inputid];
            }else{
                fileinput = $('<input type="file" accept="image/*" class="dh_uploader" style="display:none;">').attr('id', 'fileinput_'+inputid);
                _options._cache['fileinput_' + inputid] = fileinput;
                target.data('inited', true);
            }
            fileinput.unbind('change');
            fileinput.on('change', function(e){
                var file = e.target.files[0];
                if(file){ 
                    target.addClass('round');
                    var form = initUploadForm(target);
                    previewImage(form, file);
                }
            });
            fileinput[0].click();
        });
    }


    function bindUploadedHandler(target){
        var frameid = target.data('inputid');
        var callback_prefix = _options._callback_prefix;
        $('body').append($('<iframe style="display:none;">').attr('id', frameid).attr('name',frameid));
        if(_options.domain){
            window.domain = _options.domain;
        }
        window[callback_prefix + frameid] = function(data){
            $('#' + frameid).remove();
            _options._cache['fileinput_' + frameid].val('');
            if(!data.error){
                target.css('background-image', 'url(' + data.url + ')');
            }
            target.removeClass('round').append('<span class="close"></span>');
            _options.complete.apply(target, data);
            delete window[callback_prefix + frameid];
        };
    }

    function initUploadForm(target){
        var frameid = target.data('inputid'); 
        var params = _options.params;
        var form = $('<form method="post" enctype="multipart/form-data" />')
                    .attr('target', frameid)
                    .attr('id', frameid)
                    .attr('action', _options.action);
        target.attr('disabled', true);
        for(var prop in params){
            if(params.hasOwnProperty(prop))
                form.append($('<input type="hidden" >').attr('name', prop).attr('value', params[prop]));
        }
        form.append($('<input type="hidden">').attr('name', 'format').attr('value', 'scripts'));
        form.append($('<input type="hidden" name="csrf_token" value="$csrf_token()">'));
        form.append($('<input type="hidden">').attr('name', 'callback').attr('value', _options._callback_prefix + frameid));
        bindUploadedHandler(target);
        return form;
    }

    function previewImage(form, file){
        if(window.FileReader){
            var reader = new window.FileReader(),
                hideCanvas = document.createElement('canvas'),
                WIDTH = 620;

            reader.onload = function(event){
                var urlStr = event.target.result;
                //peoce android device without base64 head issuse
                if(urlStr.substring(5,10)!="image"){
                    urlStr = urlStr.replace(/(.{5})/,"$1image/jpeg;");
                }
                
                // only compress image > 100kb
                if(hideCanvas.getContext && urlStr.length > 1024 * 100){
                    var hideContext = hideCanvas.getContext('2d');
                    var image = new Image();
                    
                    image.src = urlStr;
                    image.onload = function(){
                        var upimgHeight = image.height,
                            upimgWidth = image.width,
                            HEIGHT = WIDTH * upimgHeight / upimgWidth,
                            orientation = 1;
                        
                        //get image orientation
                        EXIF.getData(image, function(){
                            orientation = parseInt(EXIF.getTag(image, 'Orientation')) || 1;
                        });
                        
                        hideCanvas.setAttribute("height", HEIGHT);
                        hideCanvas.setAttribute("width", WIDTH);
                        if(orientation == 3 || orientation == 4){
                            hideContext.rotate(180 * Math.PI / 180);
                        }   
                        else if(orientation == 5 && orientation == 6){
                            hideContext.translate(HEIGHT, 0);
                            hideContext.rotate(90 * Math.PI / 180);
                        }
                        else if(orientation == 7 || orientation == 8){
                            hideContext.translate(0, WIDTH);
                            hideContext.rotate(270 * Math.PI / 180);
                        }

                        drawImageIOSFix(hideContext, image, 0, 0, upimgWidth, upimgHeight, 0, 0, WIDTH, HEIGHT);
                        urlStr = hideCanvas.toDataURL('image/jpeg');
                        var filestr = urlStr.replace('=', '_');
                        form.append($('<input type="hidden">').attr('name', options.imgfield).attr('value', filestr));
                        form.submit(function(e) { e.stopPropagation(); }).submit();
                    }    
                }else{
                    var filestr = urlStr.replace('=', '_');
                    form.append($('<input type="hidden">').attr('name', options.imgfield).attr('value', filestr));
                    form.submit(function(e) { e.stopPropagation(); }).submit();
                }
            }

            reader.readAsDataURL(file);
        }
    }
    
    function detectVerticalSquash(img){
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
         while(py > sy){
             var alpha = data[(py - 1) * 4 + 3];
             if(alpha == 0){
                 ey = py;
             }else{
                 sy = py;
             }

             py = (ey + sy) >> 1;
         }
         return (py / imgheight) || 1;
    }

    function drawImageIOSFix(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh){
         var ratio = detectVerticalSquash(img);
         // Workd only if while imag is displayed
         ctx.drawImage(img, sx * ratio, sy * ratio, sw * ratio, sh * ratio, dx, dy, dw, dh);
    }

    window.Uploader = Uploader;
})($, EXIF);

