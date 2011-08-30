/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/_util.js
 * desc:    er框架内部的使用的功能函数集
 * author:  erik
 */

///import er.config;

er._util = function () { 
    /**
     * 获取配置信息
     * 
     * @inner
     * @param {string} name 配置项名称
     * @return {string}
     */
    function getConfig( name ) {
        var cfg = er.config,
            // 配置默认值
            defaultCfg = {         
                CONTROL_IFRAME_ID   : 'ERHistroyRecordIframe',
                DEFAULT_INDEX       : '/',
                MAIN_ELEMENT_ID     : 'Main',
                ACTION_ROOT         : '/asset/js',
                ACTION_PATH         : {},
                ACTION_AUTOLOAD     : 0
            },
            value = cfg[ name ];
        
        if ( !hasValue( value ) ) {
            value = defaultCfg[ name ] || null;
        }    
        
        return value;
    }

    /**
     * 判断变量是否有值。null或undefined时返回false
     * 
     * @param {Any} variable
     * @return {boolean}
     */
    function hasValue( variable ) {
        return !(variable === null || typeof variable == 'undefined');
    }
    
    var uIdMap_ = {};
    
    /**
     * 获取不重复的随机串
     * 
     * @param {number} opt_len 随机串长度，默认为10
     * @return {string}
     */
    function getUID( opt_len ) {
        opt_len = opt_len || 10;
        
        var chars    = "qwertyuiopasdfghjklzxcvbnm1234567890",
            charsLen = chars.length,
            len2     = opt_len,
            rand     = "";
            
        while ( len2-- ) {
            rand += chars.charAt( Math.floor( Math.random() * charsLen ) );
        }
        
        if ( uIdMap_[ rand ] ) {
            return getUID( opt_len );
        }
        
        uIdMap_[ rand ] = 1;
        return rand;
    }
    
    // 暴露相应的方法
    return {
        getUID      : getUID,
        hasValue    : hasValue,
        getConfig   : getConfig
    };
}();
