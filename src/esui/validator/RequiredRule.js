/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/RequiredRule.js
 * desc:    不能为空验证规则类
 * author:  erik
 */

///import esui.validator.ValidityState;
///import esui.validator.Rule;
///import baidu.lang.inherits;

/**
 * 不能为空验证规则类
 * 
 * @class
 * @param {Object} options 参数
 */
esui.validator.RequiredRule = function( options ) {
    options = options || {};
    options.errorMessage && (this.errorMessage = options.errorMessage);
};

esui.validator.RequiredRule.prototype = {
    /**
     * 错误提示信息
     * 
     * @public
     */
    errorMessage : "${title}不能为空",

    /**
     * 获取规则名称
     * 
     * @public
     * @return {string}
     */
    getName: function () {
        return 'required';
    },
    
    /**
     * 验证值是否合法
     * 
     * @public
     * @return {string}
     */
    check: function ( value ) {
        return value.length > 0;
    }
};

baidu.inherits( esui.validator.RequiredRule, esui.validator.Rule );
esui.validator.Rule.register( 'required', esui.validator.RequiredRule );