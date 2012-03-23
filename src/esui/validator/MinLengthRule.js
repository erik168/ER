/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/MinLengthRule.js
 * desc:    最小长度验证规则类
 * author:  mytharcher
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
esui.validator.MinLengthRule = function( options ) {
    options = options || {};
    options.errorMessage && (this.errorMessage = options.errorMessage);
};

esui.validator.MinLengthRule.prototype = {
    /**
     * 错误提示信息
     * 
     * @public
     */
    errorMessage : "${title}长度不能少于${minlength}个字符",

    /**
     * 获取规则名称
     * 
     * @public
     * @return {string}
     */
    getName: function () {
        return 'minlength';
    },
    
    /**
     * 验证值是否合法
     * 
     * @public
     * @return {string}
     */
    check: function ( value, control ) {
        var minlength = control.minlength;
        return value.length >= minlength;
    }
};

baidu.inherits( esui.validator.MinLengthRule, esui.validator.Rule );
esui.validator.Rule.register( 'minlength', esui.validator.MinLengthRule );
