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
    /**
     * 初始化函数
     *
     * @inner
     */
    function init() {
        _continue();
    }

    var initers = [];
    var phase = 'ready';
    var currIndex = 0;

    function _continue() {
        var initer;
        
        switch ( phase ) {
        case 'ready':
        case 'run':
            if ( currIndex < initers.length ) { 
                phase = 'run';
                initer = initers[ currIndex++ ];
                (typeof initer == 'function') && initer();
                _continue();
            } else {
                phase = 'inited';
                typeof er.oninit == 'function' && er.oninit();
            }
            break;
        }
    }

    /**
     * 添加初始化函数
     *
     * @public 
     * @param {Function} initer 初始化函数
     * @param {number} opt_index 初始化次序
     */
    init.addIniter = function ( initer, opt_index ) {
        if ( typeof opt_index == 'number' ) {
            if ( initers[ opt_index ] ) {
                initers.splice( opt_index, 0, initer );
            } else {
                initers[ opt_index ] = initer;
            }
        } else {
            initers.push( initer );
        }
    };

    /**
     * 停止初始化
     *
     * @public
     */
    init.stop = function () {
        if ( phase == 'run' ) {
            phase = 'stop';
        }
    };

    /**
     * 启动初始化
     *
     * @public
     */
    init.start = function () {
        if ( phase == 'stop' ) {
            phase = 'run';
            _continue();
        }
    };

    return init;
}();
