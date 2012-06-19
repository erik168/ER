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
///import er._util;
///import er.router;
///import er.init;

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
        var isChange = currentLocation != loc;

        // 存储当前信息
        // opera下，相同的hash重复写入会在历史堆栈中重复记录
        // 所以需要getLocation来判断
        if ( currentLocation != loc && getLocation() != loc ) {
            location.hash = loc;
        }

        currentLocation = loc;

        isChange && er.locator.onredirect();
        return isChange;
    }

    /**
     * 控制定位器转向
     * 
     * @public
     * @param {string} loc location位置
     * @param {Object} opt_option 转向参数
     */
    function redirect( loc, opt_option ) {
        var opt = opt_option || {};

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

        // 与当前location相同时不进行route
        var isLocChanged = updateLocation( loc );
        if ( isLocChanged || opt.enforce ) {
            loc = currentLocation;

            // 当location未变化，强制刷新时，直接route
            if ( !isLocChanged ) {
                er.router( loc );
            } else {
                doRoute( loc );
            }
        }
    }
    
    /**
     * hash变化的事件监听器
     *
     * @private
     */
    function changeListener() {
        var loc = getLocation();

        if ( !loc ) {
            redirect( '' );
        } else if ( loc !== currentLocation ) {
            updateLocation( loc );
            doRoute( loc );
        }
    }

    function doRoute( loc ) {
        // 权限判断以及转向
        var loc302 = authorize( loc );
        if ( loc302 ) {
            redirect( loc302 );
            return;
        }

        // ie下使用中间iframe作为中转控制
        // 其他浏览器直接调用控制器方法
        if ( baidu.ie && baidu.ie < 8 ) {
            ieRoute( loc );
        } else {
            er.router( loc );
        }
    }

    /**
     * 刷新当前地址
     * 
     * @public
     */
    function reload() {
        if ( currentLocation ) {
            redirect( currentLocation, { enforce: true } );
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
     *
     * @private
     */
    function init() {
        if ( baidu.ie && baidu.ie < 8 ) {
            ieCreateIframeRecorder();
            setInterval( changeListener, 100 );
        } 
        else if ( 'onhashchange' in window ) {
            window.onhashchange = changeListener;
            changeListener();
        } else {
            setInterval( changeListener, 100 );
        }
    }
    
    /**
     * ie下创建记录与控制跳转的iframe
     *
     * @private
     */
    function ieCreateIframeRecorder() {
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
    
    var authorizers = [];

    /**
     * 增加权限验证器
     *
     * @public
     * @param {Function} authorizer 验证器，验证失败时验证器返回转向地址
     */
    function addAuthorizer( authorizer ) {
        if ( 'function' == typeof authorizer ) {
            authorizers.push( authorizer );
        }
    }
    
    /**
     * 权限验证
     *
     * @inner
     * @return {string} 验证失败时验证器返回转向地址
     */
    function authorize( currLoc ) {
        var i = 0;
        var len = authorizers.length;
        var loc;

        for ( ; i < len; i++ ) {
            loc = authorizers[ i ]( currLoc );
            if ( loc ) {
                return loc;
            }
        }
    }
    
    // 注册初始化函数
    er.init.addIniter( init, 2 );

    // 返回暴露的方法
    return {
        'redirect'          : redirect,
        'reload'            : reload,
        'getLocation'       : getLocation,
        '_updateHash'       : updateLocation,
        'onredirect'        : new Function(),
        'addAuthorizer'     : addAuthorizer
    };
}();

