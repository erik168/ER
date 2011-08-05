/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/ValidityState.js
 * desc:    规则验证状态类
 * author:  erik
 */

///import esui.validator;

/**
 * 规则验证状态类
 * 
 * @class
 * @param {Object} options 参数
 */
esui.validator.ValidityState = function( options ) {
    this.message = options.message;
    this.state   = options.state;
};

esui.validator.ValidityState.prototype = {
    /**
     * 获取验证消息
     * 
     * @public
     * @return {string}
     */
    getMessage: function () {
        return this.message || '';
    },
    
    /**
     * 设置验证消息
     * 
     * @public
     * @param {string} message 验证消息
     */
    setMessage: function ( message ) {
        this.message = message;
        this.state = !!message;
    },
    
    /**
     * 获取验证状态
     * 
     * @public
     * @return {boolean}
     */
    getState: function () {
        return !!this.state;
    },
    
    /**
     * 设置验证状态
     * 
     * @public
     * @param {boolean} state 验证消息，true为值合法，false为值非法。
     */
    setState: function ( state ) {
        this.state = !!state;
    }
};
