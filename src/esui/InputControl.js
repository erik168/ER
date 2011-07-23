/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/InputControl.js
 * desc:    输入控件基类
 * author:  erik
 */

///import esui.Control;
///import baidu.lang.inherits;

/**
 * 输入控件基类
 *
 * @class
 * @param {Object} options 初始化参数
 */
esui.InputControl = function ( options ) {
    esui.Control.call( this, options );
};

esui.InputControl.prototype = {
    /**
     * 获取控件的值
     *
     * @public
     * @return {string}
     */
    getValue: function () {
        return this.value;
    },
    
    /**
     * 设置控件的值
     *
     * @public
     * @param {string} value 控件的值
     */
    setValue: function ( value ) {
        this.value = value;
    }
};  

baidu.inherits( esui.InputControl, esui.Control );
