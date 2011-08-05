/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/config.js
 * desc:    ER框架初始化方法
 * author:  erik
 */

///import er;
///import er._util;
///import baidu.ajax.request;

/**
 * 初始化ER框架
 */
er.init = function () {
    var isLoaded;

    /**
     * 初始化完成的处理函数
     *
     * @inner
     */
    function initFinish() {
        typeof er.oninit == 'function' && er.oninit();
        er.controller.init();
        er.locator.init();
    }

    return function () {
        var list    = er._util.getConfig( 'TEMPLATE_LIST' ),
            len     = list instanceof Array && list.length,
            tplBuf  = [],
            i       = 0;
            
        if ( len && !isLoaded ) {
            isLoaded = 1;
            loadTemplate();
        } else {
            initFinish();
        }
        
        /**
         * 加载模板成功的回调函数
         * 
         * @inner
         * @param {Object} xhr
         */
        function successCallback( xhr ) {
            tplBuf.push( xhr.responseText );
            loadedCallback();
        }
        
        /**
         * 每条模板加载完毕的处理函数
         * 
         * @inner
         */
        function loadedCallback() {
            i++;
            
            if ( i >= len ) {
                er.template.parse( tplBuf.join('') );
                initFinish();
            } else {
                loadTemplate();
            }
        }
        
        /**
         * 加载模板
         * 
         * @inner
         */
        function loadTemplate() {
            baidu.ajax.request(list[i], {
                'method'   : 'get',
                'onsuccess': successCallback,
                'onfailure': loadedCallback
            });
        }
    };
}();
