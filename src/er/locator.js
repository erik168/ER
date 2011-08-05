/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/locator.js
 * desc:    Hash定位器
 * author:  erik
 */

///import baidu.browser.ie;
///import baidu.browser.firefox;
///import baidu.json.parse;
///import baidu.json.stringify
///import er.router;

/**
 * Hash定位器
 * 
 * @desc
 *      Locator = [ path ] [ ~ query ]
 *      path    = "/" [ *char *( "/" *char) ]
 *      query   = *qchar
 *      char    = ALPHA | DIGIT
 *      qchar   = char | "&" | "="
 */
er.locator = function () {
    var currentLocation,
        IFRAME_CONTENT  = "<html><head></head><body><input type=\"text\" id=\"save\">"
            + "<script type=\"text/javascript\">"
            + "var loc = \"#{0}\";"
            + "document.getElementById('save').value = loc;"
            + "parent.er.locator._updateHash(loc);"
            + "parent.er.router(loc);"
            + "</script></body></html>";
    
    /**
     * 获取location信息
     * 
     * @public
     * @return {string}
     */
    function getLocation() {
        var hash;

        // firefox下location.hash会自动decode
        // 体现在：
        //   视觉上相当于decodeURI，
        //   但是读取location.hash的值相当于decodeURIComponent
        // 所以需要从location.href里取出hash值
        if ( baidu.browser.firefox ) {
            hash = location.href.match(/#(.*)$/);
            hash && (hash = hash[ 1 ]);
        } else {
            hash = location.hash;
        }

        if ( hash ) {
            return hash.replace( /^#/, '' );
        }
        
        return '';
    }
    
    /**
     * 更新hash信息
     *
     * @private
     * @param {string} loc
     */
    function updateLocation( loc ) {
        var historyList,
            historyInput,
            isOldLoc,
            i, 
            len;
        
        if ( baidu.ie && baidu.ie < 8 ) {
            //location.hash = loc;
            
            historyInput = baidu.g( er._util.getConfig( 'CONTROL_INPUT_ID' ) );
            if ( historyInput ) {
                if ( !/(~|&)_ietag=([a-z0-9]+)(&|$)/.test( loc ) ) {
                    if ( loc.indexOf('~') > 0 ) {
                        loc += '&';
                    } else {
                        loc += '~';
                    }
                    
                    loc += '_ietag=' + er._util.getUID();
                }

                historyList = baidu.json.parse( historyInput.value );

                for ( i = 0, len = historyList.length; i < len; i++ ) {
                    if ( historyList[ i ].loc == loc ) {
                        isOldLoc = i;
                        break;
                    }
                }

                if ( typeof isOldLoc != 'number' ) {
                    historyList.push( loc );
                } else {
                    uIdMap_[ RegExp.$2 ] = 1;
                }

                historyInput.value = baidu.json.stringify( historyList );
            }
        }
        
        // 存储当前信息
        // opera下，相同的hash重复写入会在历史堆栈中重复记录
        // 所以需要getLocation来判断
        if ( currentLocation != loc && getLocation() != loc ) {
            location.hash = loc;
        }

        currentLocation = loc;
        return true;
    }

    /**
     * 控制定位器转向
     * 
     * @public
     * @param {string} loc location位置
     */
    function redirect( loc ) {
        // 非string不做处理
        if ( typeof loc != 'string' ) {
            return;
        }
       
        // 增加location带起始#号的容错性
        // 可能有人直接读取location.hash，经过string处理后直接传入
        loc = loc.replace( /^#/, '' );

        // 空string当成DEFAULT_INDEX处理
        if ( loc.length == 0 ) {
            loc = er._util.getConfig( 'DEFAULT_INDEX' ); 
        }

        // 与当前location相同时不进行转向
        updateLocation( loc );
        /*if (!updateHash(loc)) {
            return;
        }*/

        loc = currentLocation;
        // 触发onredirect事件
        er.locator.onredirect();
        
        // 权限判断以及转向
        /*
        var loc302 = er.controller.authJudge( currentPath );
        if ( loc302 ) {
            er.locator.redirect( loc302 );
            return;
        }*/

        // ie下使用中间iframe作为中转控制
        // 其他浏览器直接调用控制器方法
        if ( baidu.ie && baidu.ie < 8 ) {
            ieRoute( loc );
        } else {
            er.router( loc );
        }
    }
    
    /**
     * IE下调用router
     * 
     * @private
     * @param {string} loc 地址
     */
    function ieRoute( loc ) {
        var iframe = baidu.g( er._util.getConfig( 'CONTROL_IFRAME_ID' ) ),
            iframeDoc = iframe.contentWindow.document;

        iframeDoc.open( 'text/html' );
        iframeDoc.write(
            baidu.format(
                IFRAME_CONTENT, 
                escapeIframeContent( loc )
            ));
        iframeDoc.close();
    }

    /**
     * iframe内容字符串的转义
     *
     * @private
     * @param {string} 源字符串
     * @return {string}
     */
    function escapeIframeContent( source ) {
        return source.replace( /\\/g, "\\\\" ).replace( /\"/g, "\\\"" );
    }
    
    /**
     * 初始化locator
     */
    function init() {
        /**
         * @inner
         */
        function changeListener() {
            var loc = getLocation();
            if ( loc !== currentLocation ) {
                er.locator.redirect( loc );
            }
        }
        
        if ( baidu.ie && baidu.ie < 8 ) {
            ieIframeRecorderInit();
            ieInputRecorderInit();
        }
        
        setInterval( changeListener, 100 );
    }
    
    /**
     * ie下用于记录与历史数据的input初始化
     *
     * @private
     */
    function ieInputRecorderInit() {
        var input      = baidu.g( er._util.getConfig( 'CONTROL_INPUT_ID' ) ),
            currentLoc = location.hash.replace( /^#/, '' ),
            currentIndex,
            historyList,
            i, len, item;

        if ( !input ) {
            return;
        }
        
        input.value = input.value || '[]';
        historyList = baidu.json.parse( input.value );
        
        // 记录一遍ietag
        for ( i = 0, len = historyList.length; i < len; i++ ) {
            item = historyList[ i ];
            if ( /_ietag=([a-z0-9]+)(&|$)/.test( item.loc ) ) {
                uIdMap_[ RegExp.$1 ] = 1;
            }
        }

        er.router._enable( 0 );
        for ( i = 0; i < len; i++ ) {
            item = historyList[ i ];
            if ( item == currentLoc ) {
                currentIndex = i;
                (i == len - 1) && er.router._enable( 1 );
            }
            ieRoute( item );
        }

        er.router._enable( 1 );
        i -= ( currentIndex + 1 );
        i && history.go( -i );
    }

    /**
     * ie下用于记录与控制跳转的iframe初始化
     *
     * @private
     */
    function ieIframeRecorderInit() {
        // 具有input记录历史信息的时候
        // 历史行为iframe的id需要变更
        // 避免先前的历史被保存
        if ( baidu.g( er._util.getConfig( 'CONTROL_INPUT_ID' ) ) ) {
            er.config.CONTROL_IFRAME_ID = er._util.getConfig('CONTROL_IFRAME_ID') + (new Date).getTime();
        } 

        ieIframeRecorderCreate();
    }
    
    /**
     * ie下创建记录与控制跳转的iframe
     *
     * @private
     */
    function ieIframeRecorderCreate() {
        var iframe = document.createElement('iframe'),
            size   = 200,
            pos    = '-1000px';

        iframe.id       = er._util.getConfig( 'CONTROL_IFRAME_ID' );
        iframe.width    = size;
        iframe.height   = size;
        iframe.src      = "about:blank";

        iframe.style.position   = "absolute";
        iframe.style.top        = pos;
        iframe.style.left       = pos;

        document.body.appendChild(iframe);
    }

    // 返回暴露的方法
    return {
        'redirect'          : redirect,
        'getLocation'       : getLocation,
        'init'              : init,
        '_updateHash'       : updateLocation,
        'onredirect'        : new Function()
    };
}();

