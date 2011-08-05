/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/MaxValueRule.js
 * desc:    最大值验证规则类
 * author:  erik
 */

///import esui.validator.ValidityState;
///import esui.validator.Rule;
///import baidu.lang.inherits;

/**
 * 最大值验证规则类
 * 
 * @class
 * @param {Object} options 参数
 */
esui.validator.MaxValueRule = function( options ) {
    options = options || {};
    options.errorMessage && (this.errorMessage = options.errorMessage);
};

esui.validator.MaxValueRule.prototype = {
    /**
     * 错误提示信息
     * 
     * @public
     */
    errorMessage : "${title}不能大于${max}",

    /**
     * 获取规则名称
     * 
     * @public
     * @return {string}
     */
    getName: function () {
        return 'max';
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
            return valueAsNumber <= control.max;
        }

        return true;
    }
};

baidu.inherits( esui.validator.MaxValueRule, esui.validator.Rule );
esui.validator.Rule.register( 'max', esui.validator.MaxValueRule );
