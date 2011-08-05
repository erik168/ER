/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/MinValueRule.js
 * desc:    最小值验证规则类
 * author:  erik
 */

///import esui.validator.ValidityState;
///import esui.validator.Rule;
///import baidu.lang.inherits;

/**
 * 最小值验证规则类
 * 
 * @class
 * @param {Object} options 参数
 */
esui.validator.MinValueRule = function( options ) {
    options = options || {};
    options.errorMessage && (this.errorMessage = options.errorMessage);
};

esui.validator.MinValueRule.prototype = {
    /**
     * 错误提示信息
     * 
     * @public
     */
    errorMessage : "${title}不能小于${max}",

    /**
     * 获取规则名称
     * 
     * @public
     * @return {string}
     */
    getName: function () {
        return 'min';
    },
    
    /**
     * 验证值是否合法
     * 
     * @public
     * @return {string}
     */
    check: function ( value, control ) {
        var valueAsNumber;
        if ( control.getValueAsNumber ) {
            valueAsNumber = control.getValueAsNumber();
            return valueAsNumber >= control.max;
        }

        return true;
    }
};

baidu.inherits( esui.validator.MinValueRule, esui.validator.Rule );
esui.validator.Rule.register( 'min', esui.validator.MinValueRule );
