;(function(){
    window.isloading = false;
    window.loadCommentCount = 0;
    window.isAllCommentsLoaded = false;

    //document.domain = 'qfpay.com';
    var baseUrl = "http://0.openapi2.qfpay.com/";
    var userid = $('.average-star').attr('data-userid');
  
    function scrollHandler(){
        var scrollDistance = 20,
            remaining,
            elementBottom,
            windowBottom,
            shouldScroll,
            $window = $(window),
            target = $('.comments');

        elementBottom = target.offset().top + target.height();
        windowBottom = $window.height() + $window.scrollTop();
        remaining = elementBottom - windowBottom;
        shouldScroll = remaining <= scrollDistance;

        if(shouldScroll && !window.isloading && !window.isAllCommentsLoaded){
            window.isloading = true;
            setTimeout(function(){
                loadComments();
            }, 0);
        }

        var images = $('.comment-img');
        if(images.length){
            for(var _img = 0; _img < images.length; _img++){
                var img = $(images[_img]);
                if(!img.attr('data-inited') && img[0].getAttribute){
                    img.attr('data-inited', true);
                    Intense(img);
                }
            }
        }

    }

    function extractSmallImg(url){
        var lastSlashIndex = url.lastIndexOf('/');
        var baseUrl = url.substr(0, lastSlashIndex + 1);
        var imgname = url.substr(lastSlashIndex + 1);
        return baseUrl + 'small_' + imgname;
    }
    

    function loadComments(isrefresh){
        if(window.isAllCommentsLoaded && !isrefresh){
            return;
        }

        var start = window.loadCommentCount + 1;
        var pageSize = 10;
        if(isrefresh){
            pageSize = 1;
            start = 1;
        }
        var url = baseUrl + 'mallol/v1/comment/list?key=qf_api_key&userid=' + userid + '&start=' + start + '&len=' + pageSize + '&callback=?';

        $.getJSON(url, function(result){
            if(result.resperr.length > 0){
                console.log(result.resperr);
            }else{
                var comments = result.data.records;
                onCommentsLoaded(comments, isrefresh);
                
                window.isloading = false;
                window.loadCommentCount += comments.length;
                window.isAllCommentsLoaded = comments.length < pageSize;
            }
        });
    }

    function onCommentsLoaded(comments, isrefresh){
        var comments_target= $('.comments');
        for(var i = 0; i< comments.length; i++){
            var comm = comments[i];

            var commDiv = '<div class="comment"><p class="comment-header">';
            commDiv += '<span class="created">' + comm.created + '</span>';
            commDiv += '<span class="rate">';
            for(var star = 1; star < 6; star++){
                commDiv += (star <= comm.stars ? '<span class="icon-star"></span>' : '<span class="icon-star icon-star-empty"></span>');
            }

            commDiv += '</p><p class="comment-content">' + (comm.content.length > 0 ? decodeURI(comm.content) : '好评')+ '</p>';
            
            if(comm.imgs.length > 0){
                commDiv += '<p class="comment-imgs">';
                for(var j = 0; j < comm.imgs.length; j++){
                    commDiv += '<span class="comment-img" style="background-image:url(' + extractSmallImg(comm.imgs[j]) + ')" data-image="' + comm.imgs[j] + '"/></span>';
                }
                commDiv += '</p>';
            }

            commDiv += '<p class="comment-footer">来自：' + (comm.author.length > 0 ? comm.author : '匿名') + ' 用户</p>';
            
            if(isrefresh){
                comments_target.prepend(commDiv);
            }else{
                comments_target.append(commDiv);
            }
        }

        $('.loading-wrap').fadeOut(500).remove();
    }

    $(window).ready(function(){

        $(window).on('scroll', scrollHandler);

        loadComments();
        handleRating();
        
        if(ga && window.WeixinJSBridge){
            ga('send','event','merchant opened in Weixin','pageview','pageview in Weixin', 1);
        }
        if(ga){
            $('.weidian-goods').on('click', function(){
                ga('click', 'event', 'go to mmwd', 'pageview', 'merchant page link to mmwd', 1);
            });

            $('.recent-comment').on('click', function(){
                ga('click', 'event', 'view more comments', 'pageview', 'merchant page view more comments', 1);
            });
        } 
        FastClick.attach(document.body);      
    });

    window.rateResult = function(data){
        loadComments(true);
    }

    window.uploadHandler01 = function(result){
      return fileuploadHandler(result, 'upload_form_01');
    }

    window.uploadHandler02 = function(result){
      return fileuploadHandler(result, 'upload_form_02');
    }

    window.uploadHandler03 = function(result){
      return fileuploadHandler(result, 'upload_form_03');
    }

    window.uploadHandler04 = function(result){
      return fileuploadHandler(result, 'upload_form_04');
    }

    function fileuploadHandler(result, target){
          var form = $('#' + target);
          form[0].reset();
          if(result.resperr){
              console.log(result.resperr);

              var note = $('.note');
              var originContent = note.html();
              var originColor = note.css('color');
              if(note.css('display') != 'none'){
                  note.fadeIn(500, function(){
                      note.html('亲， 暂时不支持动态图片(gif)上传').css('color', '#ffb027').fadeIn(300);
                      setTimeout(function(){
                          note.css('color', originColor).html(originContent);
                      }, 2000);
                  });
              }else{
                  note.html('亲， 暂时不支持动态图片(gif)上传').fadeIn(500, function(){
                      setTimeout(function(){
                          note.fadeOut(500, function(){
                              note.html(originContent);
                           });
                      }, 2000);
                  });
              }
              if(form.hasClass('camera')){
                  form.css('background-image', 'url(/static/img/camera.png)')    
              }else{
                  form.css('background-image', 'url(/static/img/plus.png)')
              }
          }else{
              var imgurl = result.data.url;
              
              var upload_result = $('#' + target + '_img');
              if(upload_result.length){
                  upload_result.val(imgurl);
              }else{
                  $('.input').append('<input name="imgs" type="hidden" value="' + imgurl + '" id="'+ target + '_img"' + '/>');
              }
              var smallimgUrl = extractSmallImg(imgurl); 
              form.css('background-image', 'url(' + smallimgUrl + ')')
              form.children('.uploaded-img').show();
              form.children('.filestr').val('');
          }

          var loadingtarget = $(form.children('img')[0]);
          loadingtarget.removeClass('rond');
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


     function previewImage(target, loadingtarget, form, file){
          target.attr('disabled', true);
          form.attr('data-loaded', true);
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
                  
                  var action = baseUrl + 'util/v1/uploadfile';
                  var frame_id = form.attr('target');
                  
                  if(!$(frame_id).length){
                      $('body').append('<iframe width="0" height="0" style="display:none;" name="'+frame_id+'" id="'+frame_id+'"/>');
                  }
                  form.attr('action', action);
                  // only compre image > 100kb
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
                          $(form.children('.filestr')[0]).val(filestr);
                          target.val('');
                          form.submit(function(e) { e.stopPropagation(); }).submit();
                      }    
                  }else{
                      var filestr = urlStr.replace('=', '_');
                      $(form.children('.filestr')[0]).val(filestr);
                      target.val('');
                      form.submit(function(e) { e.stopPropagation(); }).submit();
                  }
              }

              reader.readAsDataURL(file);
          }
     }

     function handleRating() {        
        $(".stars .star").click(function() {
             $this = $(this);
             var ind = $this.index();
             if(ga){
                 ga('send','event','merchant star comment','click',(ind + 1)+' star', 1);
             }
             var stars = $(".stars .star");
             for (var i = 0; i < stars.length; i++) {
                 var star = $(stars[i]);
                 if(i > ind){
                     star.addClass('star-empty');
                 }else{
                     star.removeClass('star-empty');
                 }
             }
             $('.stars .average').html((ind + 1) + ' 星');
             $("#starcount").val(ind + 1);
         });

         $('.uploaded-img').on('click', function(){
             if(ga){
                 ga('send','event','merchant image cancel event','click','anonymous user image upload cancelled', 1);
             }
             var $this = $(this);

             //show file input
             $this.hide();
             //reset background image
             var uploader = $($this.parent());
             uploader.removeAttr('data-loaded');
             uploader.children('.upload-handler').removeAttr('disabled');
             var targetimg = $('#' + uploader.attr('id') + '_img');
             if(targetimg.length){
                  targetimg.remove(); 
             }
             uploader[0].reset();
             if(uploader.hasClass('camera')){
                 uploader.css('background-image','url(/static/img/camera.png)');
             }else{
                 uploader.css('background-image','url(/static/img/plus.png)');
             }
         });

         function isOpenInWeixin(){
            return !!(window.WeixinJSBridge);
         }
          
         $('.uploader').on('click', function(){
            if(/android/i.test(navigator.userAgent) && window.WeixinJSBridge){
                $('.note.weixin-note').fadeIn(500, function(){
                    setTimeout(function(){
                        $('.note.weixin-note').fadeOut(300);
                    }, 3000);
                });
                return false;
            }
         });

         $('.upload-handler').on('change', function(){
              
             if(ga){
                 ga('send','event','merchant comment image upload event','click','anonymous user image upload.', 1);
             }
                 
              var target = $(this);
              var fileinput = this;
              if(!target.val()) return;
              var valid_extensions = ['gif','png','jpg','jpeg'];
              var ext = target.val().split('.').pop().toLowerCase();
              if(valid_extensions.indexOf(ext) != -1)
              {
                  var form = $(target.parent());
                  form.css('background-image', 'none');
                  var loadingtarget = $(form.children('img')[0]);
                  loadingtarget.addClass('rond');
                  previewImage(target,loadingtarget, form, fileinput.files[0]);
              }else{
                  var note = $('.note');
                  var originContent = note.html();
                  if(note.css('display') != 'none'){
                      note.html('亲，我们只接收图片哦').fadeIn(500).html(originContent);
                  }else{
                      note.html('亲，我们只接收图片哦').fadeIn(500, function(){
                                 setTimeout(function(){
                                     note.fadeOut(500, function(){
                                         note.html(originContent);
                                      });
                                }, 2000);
                      });
                  }
              }
          });

        
         var container = $('.rating-control');
         var topheight = -1 * container.height();
         var init_top = container.css('top');
         var hasshown = false;

         $('.hidediv_bg, .close').click(hideRateControl);
         
         function hideRateControl(){
            container.animate({top: init_top}, 500, 'ease-out', function(){});
            $('.hidediv_bg').hide();
            window.hasRated = false;
            $('.note.weixin-note').hide();
            hasshown = false;
             
            var rateForm = $('.input');
            rateForm[0].reset();
            $('.stars .star').removeClass('star-empty');
            $('.stars .average').html('5 星');
            
            $('#upload_form_01').css('background-image','url(/static/img/camera.png)')[0].reset();
            $('#upload_form_02').css('background-image','url(/static/img/plus.png)')[0].reset();
            $('#upload_form_03').css('background-image','url(/static/img/plus.png)')[0].reset();
            $('#upload_form_04').css('background-image','url(/static/img/plus.png)')[0].reset();
            $('.uploaded-img').css('display','none');
            $('.upload-handler').removeAttr('disabled').val('');
            $('.input input[name="imgs"]').val('');
            rateForm.data('hasRated', false);
         }

         window.hasRated = false;
         $(".phone-btn").click(function() {
             if(!hasshown){
                hasshown = true;
                container.animate({top: topheight}, 500, 'ease-out', function(){
                });
                $('.hidediv_bg').css({'display':'block', 'height':$(document).height()});
                return false;
             }

             var $this = $(this);
             if(ga){
                 ga('send','event','submit','click','submit anonymous comment.', 1);
             }
             
             var note = $('.note');
             var rateControl = $('.rating-control');
             var desArea = $('#des');
             if(!desArea.val() && !hasRated){
                 rateControl.css('top', topheight - 20);
                 note.html("亲，您确定不写点什么吗？").fadeIn(500, function(){
                    setTimeout(function(){
                        note.fadeOut(300, function(){
                            rateControl.css('top', topheight);
                        });
                    }, 3000);
                 });
                 window.hasRated = true;
                 return false;
             }
            
             desArea.val(encodeURI(desArea.val()));
             $('.input').attr('action', baseUrl + 'mallol/v1/comment/add').submit();
             hideRateControl();
         });
     }

})();
