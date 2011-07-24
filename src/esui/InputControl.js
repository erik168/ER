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
     * 渲染控件
     *
     * @public
     */
    render: function () {
        this.name = this.main.getAttribute( 'name' );
        esui.Control.prototype.render.call( this );
    },

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
    },
    
    /**
     * 创建Input元素
     *
     * @protected
     * @return {HTMLInputElement}
     */
    __createInput: function ( options ) {
        var tagName = options.tagName;
        var name    = options.name;
        var type    = options.type;
        var creater = tagName;
        var input;

        name && ( creater = '<' + tagName + ' name="' + this.name + '">' );
        input = document.createElement( creater ); 

        // 非IE浏览器不认createElement( '<input name=...' )
        if ( !input ) {
            input = document.createElement( tagName );
            name && ( input.name = name );
        }

        type && ( input.type = type );
        return input;
    }
};  

baidu.inherits( esui.InputControl, esui.Control );
