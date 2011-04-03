/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Radio.js
 * desc:    单选框控件
 * author:  zhaolei, erik
 * date:    $Data$
 */

/**
 * 单选框控件
 * 
 * @param {Object} options 控件初始化参数
 */
ui.Radio = function (options) {
    // 初始化参数
    this.__initOptions(options);
    this._type      = 'radiobox';

    this._wrapTag   = 'INPUT';
    this._wrapType  = 'radio';
};

// 继承自BaseBox
ui.Radio.prototype = new ui.BaseBox();
ui.BaseInput.derive(ui.Radio);
