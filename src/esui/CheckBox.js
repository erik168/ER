/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/CheckBox.js
 * desc:    多选框控件
 * author:  zhaolei, erik
 * date:    $Date$
 */

/**
 * 多选框控件
 * 
 * @param {Object} options 控件初始化参数
 */
ui.CheckBox = function (options) {
    // 初始化参数
    this.__initOptions(options);
    this._type      = 'checkbox';
    
    this._wrapTag   = 'INPUT';
    this._wrapType  = 'checkbox';
};

/**
 * 继承自BaseBox
 */
ui.CheckBox.prototype = new ui.BaseBox();

/**
 * 获取参数值
 * 
 * @public
 * @return {string}
 */
ui.CheckBox.prototype.getParamValue = function () {
    if (this.getChecked()) {
        return this.getChecked() - 0;
    }
    
    return 0;
};


ui.BaseInput.derive(ui.CheckBox);
