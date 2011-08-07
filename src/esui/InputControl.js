/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/InputControl.js
 * desc:    输入控件基类
 * author:  erik
 */

///import esui.Control;
///import baidu.lang.inherits;
///import esui.validator.Rule;
///import esui.validator.Validity;
///import esui.validator.ValidityState;

/**
 * 输入控件基类
 *
 * @class
 * @param {Object} options 初始化参数
 */
esui.InputControl = function ( options ) {
    esui.Control.call( this, options );

    this._validatorMessageClass = 'ui-validator-message';

    /**
     * @inner
     */
    function addRule( ruleObj ) {
        if ( !ruleObj ) {
            return;
        }

        if ( typeof ruleObj == 'string' ) {
            rules.push( esui.validator.Rule.get( ruleObj ) );
        } else if ( ruleObj instanceof esui.validator.Rule ) {
            rules.push( ruleObj );
        } else if ( typeof ruleObj == 'object' ) {
            rules.push( new esui.validator.Rule( {
                name            : ruleObj.name,
                errorMessage    : ruleObj.errorMessage,
                check           : ruleObj.check
            } ) );
        }
    }

    // 验证规则初始化
    var rule = this.rule;
    var rules = [];
    this._rules = rules;
    if ( typeof rule == 'string' ) {
        rule = rule.split( ',' );
    }

    if ( rule instanceof Array ) {
        var ruleLen = rule.length;
        var i;

        for ( i = 0; i < ruleLen; i++ ) {
            addRule( rule[ i ] );
        }
    } else {
        addRule( rule );
    }
};

esui.InputControl.prototype = {
    /**
     * 渲染控件
     *
     * @public
     */
    render: function () {
        this.name = this.main.getAttribute( 'name' );
        esui.Control.prototype.render.call( this );
    },
    
    /**
     * 获取控件的name
     *
     * @public
     * @return {string}
     */
    getName: function () {
        return this.name;
    },

    /**
     * 获取控件的值
     *
     * @public
     * @return {string}
     */
    getValue: function () {
        return this.value;
    },
    
    /**
     * 设置控件的值
     *
     * @public
     * @param {string} value 控件的值
     */
    setValue: function ( value ) {
        this.value = value;
    },
    
    /**
     * 创建Input元素
     *
     * @protected
     * @return {HTMLInputElement}
     */
    __createInput: function ( options ) {
        var tagName = options.tagName;
        var name    = options.name;
        var type    = options.type;
        var creater = tagName;
        var input;

        name && ( creater = '<' + tagName + ' name="' + this.name + '">' );
        input = document.createElement( creater ); 

        // 非IE浏览器不认createElement( '<input name=...' )
        if ( !input ) {
            input = document.createElement( tagName );
            name && ( input.name = name );
        }

        type && ( input.type = type );
        return input;
    },

    onbeforevalidate    : new Function(),
    onaftervalidate     : new Function(),
    oninvalid           : new Function(),
    
    /**
     * 验证控件
     * 
     * @protected
     * @param {boolean} 是否仅验证
     * @return {boolean} 是否验证通过
     */
    __validate: function ( justCheck ) {
        var i, len, rule;
        var rules = this._rules;
        var isValid;
        var validity = new esui.validator.Validity();
        
        // 开始验证前事件触发
        !justCheck && this.onbeforevalidate( validity );

        // 开始验证
        for ( i = 0, len = rules.length; i < len; i++ ) {
            rule = rules[ i ];
            validity.addState( rule.getName(), rule.checkValidity( this ) );
        }

        // 验证完成后事件触发
        !justCheck && this.onaftervalidate( validity );
        
        // 验证失败事件触发
        isValid = validity.isValid();
        if ( !isValid ) {
            this.oninvalid( validity );
        }
        
        // 验证信息显示
        !justCheck && this.showValidity( validity );

        return isValid;
    },
    
    /**
     * 验证控件，仅返回是否验证通过
     * 
     * @public
     * @return {boolean} 是否验证通过
     */
    checkValidity: function () {
        return this.__validate( true );
    },
    
    /**
     * 验证控件，当值不合法时显示错误信息
     * 
     * @public
     * @return {boolean} 是否验证通过
     */
    validate: function () {
        return this.__validate();
    },
    
    /**
     * 显示验证信息
     * 
     * @public
     * @param {validator.Validity} 验证信息
     */
    showValidity: function ( validity ) {
        var isValid         = validity.isValid();
        var dom             = this.__getValidMsgDom();
        var states          = validity.getStateList();
        var customMessage   = validity.getCustomMessage();
        var msg             = [];
        var i, len, state;


        if ( isValid ) {
            dom.innerHTML = '';
            baidu.hide( dom );
        } else {
            if ( customMessage ) {
                dom.innerHTML = customMessage;
            } else {
                for ( i = 0, len = states.length; i < len - 1; i++ ) {
                    state = states[ i ];
                    !state.getState() && msg.push( state.getMessage() );
                }

                dom.innerHTML = msg.join( ',' );
            }

            baidu.show( dom );
        }
    },

    /**
     * 获取显示验证信息的容器
     * 
     * @public
     * @return {HTMLElement}
     */
    __getValidMsgDom: function () {
        var id = this.__getId( 'validatemessage' );
        var dom = baidu.g( id );
        var father;

        if ( !dom ) {
            dom = document.createElement( 'span' );
            dom.id = id;
            dom.className = this._validatorMessageClass;
            father = this.main.parentNode;
            father && father.insertBefore( dom, this.main.nextSibling );
        }
        
        return dom;
    }
};  

baidu.inherits( esui.InputControl, esui.Control );
