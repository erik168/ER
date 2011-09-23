/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/MaxLengthRule.js
 * desc:    最大长度验证规则类
 * author:  erik
 */

///import esui.validator.ValidityState;
///import esui.validator.Rule;
///import baidu.lang.inherits;

/**
 * 最大长度验证规则类
 * 
 * @class
 * @param {Object} options 参数
 */
esui.validator.MaxLengthRule = function( options ) {
    options = options || {};
    options.errorMessage && (this.errorMessage = options.errorMessage);
};

esui.validator.MaxLengthRule.prototype = {
    /**
     * 错误提示信息
     * 
     * @public
     */
    errorMessage : "${title}长度不能超过${maxlength}个字符",

    /**
     * 获取规则名称
     * 
     * @public
     * @return {string}
     */
    getName: function () {
        return 'maxlength';
    },
    
    /**
     * 验证值是否合法
     * 
     * @public
     * @return {string}
     */
    check: function ( value, control ) {
        var maxLength = control.maxlength;
        return value.length <= maxLength;
    }
};

baidu.inherits( esui.validator.MaxLengthRule, esui.validator.Rule );
esui.validator.Rule.register( 'maxlength', esui.validator.MaxLengthRule );
