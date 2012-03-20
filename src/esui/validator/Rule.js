/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/Rule.js
 * desc:    验证规则类
 * author:  erik
 */

///import esui.validator.ValidityState;

/**
 * 验证规则类
 * 
 * @class
 * @param {Object} options 参数
 */
esui.validator.Rule = function () {
    var RuleClassMap = {};
    function Rule( options ) {
        this.name           = options.name;
        this.check          = options.check;
        this.errorMessage   = options.errorMessage;
    };

    Rule.prototype = {
        /**
         * 获取规则名称
         * 
         * @public
         * @return {string}
         */
        getName: function () {
            return this.name;
        },
        
        /**
         * 验证控件的状态
         * 
         * @public
         * @param {InputControl} control 要验证的控件
         * @return {validator.ValidityState}
         */
        checkValidity: function ( control ) {
            var value = control.getValue();
            var isValid = this.check( value, control );
            var message = '';

            if ( !isValid ) {
                message = this.errorMessage.replace( /\x24\{([a-z0-9_-]+)\}/g, function ( matcher, word ) {
                    return control[ word ] || '';
                } );
            }
            
            return new esui.validator.ValidityState( {
                state   : isValid,
                message : message
            } );
        }
    };
    
    /**
     * 注册规则类型
     *
     * @static
     * @public
     * @param {string} name 规则名
     * @param {Function} RuleClass 规则类
     */
    Rule.register = function ( name, RuleClass ) {
        RuleClassMap[ name ] = RuleClass;
    };
    
    /**
     * 获取规则
     *
     * @static
     * @public
     * @param {string} name 规则名
     * @param {Object} opt_options 规则参数
     * @return {validator.Rule}
     */
    Rule.get = function ( name, opt_options ) {
        var clazz = RuleClassMap[ name ];
        if ( clazz ) {
            return new clazz( opt_options );
        }

        return null;
    };

    return Rule;
}();
