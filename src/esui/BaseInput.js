/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/BaseInput.js
 * desc:    输入型控件的基础功能
 * author:  erik
 * date:    2011/01/18
 */

/**
 * ui控件的基础功能
 */
ui.BaseInput = {
    /**
     * 通过派生实现通用功能
     * 
     * @public
     * @param {Function} clazz 控件类
     */
    derive: function (clazz) {
        var methods = [
                '__ui-input__'],
            len = methods.length,
            proto = clazz.prototype,
            i = 0,
            method;
            
        for (; i < len; i++) {
            method = methods[i];
            if (!proto[method]) {
                proto[method] = ui.BaseInput[method];
            }
        }

        ui.Base.derive(clazz);
    },
    
    /**
     * 控件标识
     *
     * @private
     */
    '__ui-input__': 1
};  
