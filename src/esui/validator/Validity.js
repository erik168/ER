/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/validator/Validity.js
 * desc:    验证信息类
 * author:  erik
 */

///import esui.validator.ValidityState;

/**
 * 验证信息类
 * 
 * @class
 * @param {Object} options 参数
 */
esui.validator.Validity = function () {
    this._states = [];
    this._customState = new esui.validator.ValidityState( {
        state : true
    } );

    this._stateMap = {};
};

esui.validator.Validity.prototype = {
    /**
     * 添加验证状态
     * 
     * @public
     * @param {string} name 验证名
     * @param {validator.ValidityState} state 验证状态
     */
    addState: function ( name, state ) {
        if ( state instanceof esui.validator.ValidityState ) {
            this._states.push( state );
            this._stateMap[ name ] = state;
        }
    },
    
    /**
     * 获取自定义验证信息
     * 
     * @public
     * @return {string}
     */
    getCustomMessage: function () {
        return this._customState.getMessage();
    },
    
    /**
     * 设置自定义验证信息
     * 
     * @public
     * @param {string} message 自定义验证信息
     */
    setCustomMessage: function ( message ) {
        this._customState.setMessage( message );
    },
    
    /**
     * 获取验证状态集合
     * 
     * @public
     * @return {Array}
     */
    getStateList: function () {
        var list = this._states.slice( 0 );
        list.push( this._customState );
        return list;
    },
    
    /**
     * 是否验证通过
     * 
     * @public
     * @return {boolean}
     */
    isValid: function () {
        var stateList = this.getStateList();
        var len = stateList.length;

        while ( len-- ) {
            if ( !stateList[ len ].getState() ) {
                return false;
            }
        }

        return true;
    },
    
    /**
     * 获取验证状态
     * 
     * @public
     * @param {string} name 验证名
     * @return {validator.ValidityState}
     */
    getState: function ( name ) {
        return this._stateMap[ name ] || null;
    }
};
