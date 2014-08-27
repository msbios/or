$(function() {

    var $ibWrapper = $('#or-main-wrapper'),

    Template = (function() {

        // true if dragging the container
        var kinetic_moving = false,
        // current index of the opened item
        current = -1,
        // true if the item is being opened / closed
        isAnimating = false,
        // items on the grid
        $ibItems = $ibWrapper.find('div.or-main > a'),
        // image items on the grid
        $ibImgItems = $ibItems.not('.or-content'),
        // total image items on the grid
        imgItemsCount = $ibImgItems.length,
        init = function() {

            // add a class or-image to the image items
            $ibImgItems.addClass('or-image');
            // apply the kinetic plugin to the wrapper
            loadKinetic();
            // load some events
            initEvents();

        },
        loadKinetic = function() {

            setWrapperSize();

            $ibWrapper.kinetic({
                moved : function() {
                    kinetic_moving = true;
                },
                stopped : function() {
                    kinetic_moving = false;
                }
            });

        },
        setWrapperSize = function() {

            var containerMargins = $('#or-top').outerHeight(true) + $('#copyright').outerHeight(true) + parseFloat( $ibItems.css('margin-top') );
            $ibWrapper.css( 'height', $(window).height() - containerMargins )

        },
        initEvents = function() {

            // open the item only if not dragging the container
            $ibItems.bind('click.ibTemplate', function( event ) {

                if( !kinetic_moving )
                    openItem( $(this) );

                return false; 

            });

            // on window resize, set the wrapper and preview size accordingly
            $(window).bind('resize.ibTemplate', function( event ) {

                setWrapperSize();

                $('#or-img-preview, #or-content-preview').css({
                    width : $(window).width(),
                    height : $(window).height()
                })

            });

        },
        openItem = function( $item ) {

            if( isAnimating ) return false;

            // if content item
            if( $item.hasClass('or-content') ) {

                isAnimating = true;
                current = $item.index('.or-content');
                loadContentItem( $item, function() {
                    isAnimating = false;
                } );

            }
            // if image item
            else {

                isAnimating = true;
                current = $item.index('.or-image');
                loadImgPreview( $item, function() {
                    isAnimating = false;
                } );

            }

        },
        // opens one image item (fullscreen)
        loadImgPreview = function( $item, callback ) {

            var largeSrc = $item.children('img').data('largesrc'),
            description = $item.children('span').text(),
            largeImageData = {
                src : largeSrc,
                description : description
            };

            // preload large image
            $item.addClass('or-loading');

            preloadImage( largeSrc, function() {

                $item.removeClass('or-loading');

                var hasImgPreview = ( $('#or-img-preview').length > 0 );

                if( !hasImgPreview )
                    $('#previewTmpl').tmpl( largeImageData ).insertAfter( $ibWrapper );
                else
                    $('#or-img-preview').children('img.or-preview-img').attr( 'src', largeSrc );

                //get dimentions for the image, based on the windows size
                var dim = getImageDim( largeSrc );

                $item.removeClass('or-img-loading');

                //set the returned values and show/animate preview
                $('#or-img-preview').css({
                    width : $item.width(),
                    height : $item.height(),
                    left : $item.offset().left,
                    top : $item.offset().top
                }).children('img.or-preview-img').hide().css({
                    width : dim.width,
                    height : dim.height,
                    left : dim.left,
                    top : dim.top
                }).fadeIn( 400 ).end().show().animate({
                    width : $(window).width(),
                    left : 0
                }, 500, 'easeOutExpo', function() {

                    $(this).animate({
                        height : $(window).height(),
                        top : 0
                    }, 400, function() {

                        var $this = $(this);
                        $this.find('span.or-preview-descr, span.or-close').show()
                        if( imgItemsCount > 1 )
                            $this.find('div.or-nav').show();

                        if( callback ) callback.call();

                    });

                });

                if( !hasImgPreview )
                    initImgPreviewEvents();

            } );

        },
        // opens one content item (fullscreen)
        loadContentItem = function( $item, callback ) {

            var hasContentPreview = ( $('#or-content-preview').length > 0 ),
            teaser = $item.children('div.or-teaser').html(),
            content = $item.children('div.or-content-full').html(),
            contentData = {
                teaser : teaser,
                content : content
            };

            if( !hasContentPreview )
                $('#contentTmpl').tmpl( contentData ).insertAfter( $ibWrapper );

            //set the returned values and show/animate preview
            $('#or-content-preview').css({
                width : $item.width(),
                height : $item.height(),
                left : $item.offset().left,
                top : $item.offset().top
            }).show().animate({
                width : $(window).width(),
                left : 0
            }, 500, 'easeOutExpo', function() {

                $(this).animate({
                    height : $(window).height(),
                    top : 0
                }, 400, function() {

                    var $this = $(this),
                    $teaser = $this.find('div.or-teaser'),
                    $content= $this.find('div.or-content-full'),
                    $close = $this.find('span.or-close');

                    if( hasContentPreview ) {
                        $teaser.html( teaser )
                        $content.html( content )
                    }

                    $teaser.show();
                    $content.show();
                    $close.show();

                    if( callback ) callback.call();

                });

            });

            if( !hasContentPreview )
                initContentPreviewEvents(); 

        },
        // preloads an image
        preloadImage = function( src, callback ) {

            $('<img/>').load(function(){

                if( callback ) callback.call();

            }).attr( 'src', src );

        },
        // load the events for the image preview : navigation ,close button, and window resize
        initImgPreviewEvents = function() {

            var $preview = $('#or-img-preview');

            $preview.find('span.or-nav-prev').bind('click.ibTemplate', function( event ) {

                navigate( 'prev' );

            }).end().find('span.or-nav-next').bind('click.ibTemplate', function( event ) {

                navigate( 'next' );

            }).end().find('span.or-close').bind('click.ibTemplate', function( event ) {

                closeImgPreview();

            });

            //resizing the window resizes the preview image
            $(window).bind('resize.ibTemplate', function( event ) {

                var $largeImg = $preview.children('img.or-preview-img'),
                dim = getImageDim( $largeImg.attr('src') );

                $largeImg.css({
                    width : dim.width,
                    height : dim.height,
                    left : dim.left,
                    top : dim.top
                })

            });

        },
        // load the events for the content preview : close button
        initContentPreviewEvents = function() {

            $('#or-content-preview').find('span.or-close').bind('click.ibTemplate', function( event ) {

                closeContentPreview();

            });

        },
        // navigate the image items in fullscreen mode
        navigate = function( dir ) {

            if( isAnimating ) return false;

            isAnimating = true;

            var $preview = $('#or-img-preview'),
            $loading = $preview.find('div.or-loading-large');

            $loading.show();

            if( dir === 'next' ) {

                ( current === imgItemsCount - 1 ) ? current = 0 : ++current;

            }
            else if( dir === 'prev' ) {

                ( current === 0 ) ? current = imgItemsCount - 1 : --current;

            }

            var $item = $ibImgItems.eq( current ),
            largeSrc = $item.children('img').data('largesrc'),
            description = $item.children('span').text();

            preloadImage( largeSrc, function() {

                $loading.hide();

                //get dimentions for the image, based on the windows size
                var dim = getImageDim( largeSrc );

                $preview.children('img.or-preview-img')
                .attr( 'src', largeSrc )
                .css({
                    width : dim.width,
                    height : dim.height,
                    left : dim.left,
                    top : dim.top
                })
                .end()
                .find('span.or-preview-descr')
                .text( description );

                $ibWrapper.scrollTop( $item.offset().top )
                .scrollLeft( $item.offset().left );

                isAnimating = false;

            });

        },
        // closes the fullscreen image item
        closeImgPreview = function() {

            if( isAnimating ) return false;

            isAnimating = true;

            var $item = $ibImgItems.eq( current );

            $('#or-img-preview').find('span.or-preview-descr, div.or-nav, span.or-close')
            .hide()
            .end()
            .animate({
                height : $item.height(),
                top : $item.offset().top
            }, 500, 'easeOutExpo', function() {

                $(this).animate({
                    width : $item.width(),
                    left : $item.offset().left
                }, 400, function() {

                    $(this).fadeOut(function() {
                        isAnimating = false;
                    });

                } );

            });

        },
        // closes the fullscreen content item
        closeContentPreview = function() {

            if( isAnimating ) return false;

            isAnimating = true;

            var $item = $ibItems.not('.or-image').eq( current );

            $('#or-content-preview').find('div.or-teaser, div.or-content-full, span.or-close')
            .hide()
            .end()
            .animate({
                height : $item.height(),
                top : $item.offset().top
            }, 500, 'easeOutExpo', function() {

                $(this).animate({
                    width : $item.width(),
                    left : $item.offset().left
                }, 400, function() {

                    $(this).fadeOut(function() {
                        isAnimating = false;
                    });

                } );

            });

        },
        // get the size of one image to make it full size and centered
        getImageDim = function( src ) {

            var img = new Image();
            img.src = src;

            var w_w = $(window).width(),
            w_h = $(window).height(),
            r_w = w_h / w_w,
            i_w = img.width,
            i_h = img.height,
            r_i = i_h / i_w,
            new_w, new_h,
            new_left, new_top;

            if( r_w > r_i ) {

                new_h = w_h;
                new_w = w_h / r_i;

            } 
            else {

                new_h = w_w * r_i;
                new_w = w_w;

            }

            return {
                width : new_w,
                height : new_h,
                left : (w_w - new_w) / 2,
                top : (w_h - new_h) / 2
            };

        };

        return {
            init : init
        };

    })();

    Template.init();

});