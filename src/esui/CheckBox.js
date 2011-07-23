/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/CheckBox.js
 * desc:    多选框控件
 * author:  zhaolei, erik
 */

///import esui.BoxControl;
///import baidu.lang.inherits;

/**
 * 多选框控件
 * 
 * @param {Object} options 控件初始化参数
 */
esui.CheckBox = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'checkbox';

    esui.BoxControl.call( this, options );
};

baidu.inherits( esui.CheckBox, esui.BoxControl );
