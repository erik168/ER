/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/PatternRule.js
 * desc:    正则表达式验证规则类
 * author:  erik
 */

///import esui.validator.ValidityState;
///import esui.validator.Rule;
///import baidu.lang.inherits;

/**
 * 正则表达式验证规则类
 * 
 * @class
 * @param {Object} options 参数
 */
esui.validator.PatternRule = function( options ) {
    options = options || {};
    options.errorMessage && (this.errorMessage = options.errorMessage);
};

esui.validator.PatternRule.prototype = {
    /**
     * 错误提示信息
     * 
     * @public
     */
    errorMessage : "${title}不符合规则",

    /**
     * 获取规则名称
     * 
     * @public
     * @return {string}
     */
    getName: function () {
        return 'pattern';
    },
    
    /**
     * 验证值是否合法
     * 
     * @public
     * @return {string}
     */
    check: function ( value, control ) {
        var pattern = control.pattern;
        if ( pattern && typeof pattern == 'string' ) {
            pattern = new RegExp( pattern );
        }

        if ( pattern instanceof RegExp ) {
            return pattern.test( value );
        }

        return true;
    }
};

baidu.inherits( esui.validator.PatternRule, esui.validator.Rule );
esui.validator.Rule.register( 'pattern', esui.validator.PatternRule );
