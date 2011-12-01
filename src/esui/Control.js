/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Control.js
 * desc:    ui控件基类
 * author:  erik, zhaolei 
 */

///import esui.util;
///import esui.get;
///import esui.init;
///import esui.create;
///import esui.dispose;
///import baidu.dom.addClass;
///import baidu.dom.removeClass;

/**
 * 控件基类
 *
 * @class
 * @param {Object} options 初始化参数
 */
esui.Control = function ( options ) {
    this._state = {};

    // 初始化参数
    this.__initOptions( options );

    // 生成控件id
    if ( !this.id ) {
        this.id = esui.util.getGUID();
    }

    esui.util.construct( this );
};

esui.Control.prototype = {

    /**
     * 渲染控件
     * 
     * @public
     */
    render: function () {
        var main = this.main;

        if ( !this._isRendered ) {
            !main.id && ( main.id = this.__getId() );
            main.setAttribute( 'data-control', this.id );
            baidu.addClass( main, this.__getClass() );
            
            if ( this._autoState ) {
                this.__initStateChanger();
            }

            this._isRendered = true;
        }    
    },
    
    /**
     * 将控件添加到页面的某个元素中
     *
     * @public
     * @param {HTMLElement} wrap
     */
    appendTo: function ( wrap ) {
        wrap = wrap || document.body;
        wrap.appendChild( this.main );
        this.render();
    },

    /**
     * 设置控件为不可用
     *
     * @public
     */
    disable: function () {
        this.addState( 'disabled' );
        this.disabled = true;
    },
    
    /**
     * 设置控件为可用
     *
     * @public
     */
    enable: function () {
        this.removeState( 'disabled' );
        this.disabled = false;
    },

    /**
     * 判断控件不可用状态
     * 
     * @public
     * @return {boolean}
     */
    isDisabled: function () {
        return this.getState( 'disabled' );
    },
    
    /**
     * 设置控件不可用状态
     *
     * @public
     * @param {boolean} disabled
     */
    setDisabled: function ( disabled ) {
        this[ disabled ? 'disable': 'enable' ]();
    },

    /**
     * 添加控件的当前状态
     * 
     * @public
     * @param {string} state 要设置的状态
     */
    addState: function ( state ) {
        this._state[ state ] = 1;
        baidu.addClass( this.main, this.__getClass( state ) );
    },
    
    /**
     * 移除控件的当前状态
     * 
     * @public
     * @param {string} state 要移除的状态
     */
    removeState: function ( state ) {
        delete this._state[ state ];
        baidu.removeClass( this.main, this.__getClass( state ) );
    },
    
    /**
     * 获取控件状态
     * 
     * @public
     * @param {string} state 要获取的状态
     * @return {boolean}
     */
    getState: function ( state ) {
        return !!this._state[ state ];
    },
    
    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        esui.util.dispose( this );
    },
    
    /**
     * 构造控件
     *
     * @protected
     */
    __construct: function () {
        // 生成控件主元素
        if ( !this.main ) {
            this.main = this.__createMain();
        }
        
        // 子控件容器
        this._controlMap = {};
    },

    /**
     * 释放控件
     * 
     * @protected
     */
    __dispose: function () {
        var controlMap  = this._controlMap,
            main        = this.main;
        
        // dispose子控件
        if ( controlMap ) {
            for ( var k in controlMap ) {
                esui.util.dispose( controlMap[k].id );
                delete controlMap[ k ];
            }
        }
        this._controlMap = null;
        
        // 释放控件主区域的事件以及引用
        if ( main ) {
            main.onclick     = null;
            main.onmouseover = null;
            main.onmouseout  = null;
            main.onmousedown = null;
            main.onmouseup   = null;
        }

        this.main = null;
    },
        
    /**
     * 初始化参数
     * 
     * @protected
     * @param {Object} options 参数集合
     */
    __initOptions: function ( options ) {
        for ( var k in options ) {
            this[ k ] = options[ k ];
        }
    },
    
    /**
     * 初始化单一参数
     * 
     * @protected
     * @param {string} name 参数名称
     * @param {Any}    opt_defaultValue 默认值
     * @param {string} opt_configName 对应的控件配置名
     */
    __initOption: function ( name, opt_defaultValue, opt_configName ) {
        var hasValue = esui.util.hasValue;

        if ( !hasValue( this[ name ] ) ) {
            if ( 'string' == typeof opt_configName ) {
                this[ name ] = this.constructor[ opt_configName ];
            } 
            
            if ( !hasValue( this[ name ] )
                && hasValue( opt_defaultValue )
            ) {
                this[ name ] = opt_defaultValue;
            } 
        }
    },
    
    /**
     * 创建控件主元素
     *
     * @protected
     * @return {HTMLElement}
     */
    __createMain: function () {
        return document.createElement( 'div' );
    },

    /**
     * 获取dom子部件的css class
     * 
     * @protected
     * @return {string}
     */
    __getClass: function ( name ) {
        var me          = this,
            type        = me._type.toLowerCase(),
            suffix      = (name ? '-' + name : ''),
            className   = [ ('ui-' + type + suffix) ],
            skinName    = me.skin,
            i, len;
        
        // 将skin转换成数组
        if ( skinName && typeof skinName == 'string' ) {
            skinName = me.skin = skinName.split( /\s+/ );
        }


        if ( skinName instanceof Array ) {
            for ( i = 0, len = skinName.length; i < len; i++ ) {
                className.push( 'skin-' + type + '-' + skinName[ i ] + suffix );
            }
        }  
        
        return className.join( ' ' );
    },
    
    /**
     * 获取dom子部件的id
     * 
     * @protected
     * @return {string}
     */
    __getId: function ( name ) {
        var idPrefix = 'ctrl' + this._type + this.id;
        if ( name ) {
            return idPrefix + name;
        }

        return idPrefix;
    },

    /**
     * 获取控件对象的全局引用字符串
     * 
     * @protected
     * @return {string}
     */
    __getStrRef: function () {
        return "esui.util.get('" + this.id + "')";
    },
    
    /**
     * 获取控件对象方法的全局引用字符串
     * 
     * @protected
     * @param {string} fn 调用的方法名
     * @param {Any...} anonymous 调用的参数
     * @return {string}
     */
    __getStrCall: function ( fn ) {
        var argLen = arguments.length,
            params = [],
            i, arg;

        if ( argLen > 1 ) {
            for ( i = 1; i < argLen; i++ ) {
                arg = arguments[i];
                if ( typeof arg == 'string' ) {
                    arg = "'" + arg +"'";
                }
                params.push( arg );
            }
        }
        
        return esui.util.format(
                "{0}.{1}({2});",
                this.__getStrRef(),
                fn,
                params.join(',') );
    },
    
    /**
     * 初始化状态事件
     * 
     * @protected
     * @desc
     *      默认为控件的主dom元素挂载4个mouse事件
     *      实现hover/press状态切换的样式设置
     */
    __initStateChanger: function () {
        var me = this,
            main = me.main;
        
        me._state = {};
        if ( main ) {
            main.onmouseover = me.__getMainOverHandler();
            main.onmouseout  = me.__getMainOutHandler();
            main.onmousedown = me.__getMainDownHandler();
            main.onmouseup   = me.__getMainUpHandler();
        }
    },
    
    /**
     * 获取主元素over的鼠标事件handler
     * 
     * @protected
     * @return {Function}
     */
    __getMainOverHandler: function () {
        var me = this;
        return function () {
            if ( !me._state[ 'disabled' ]) {
                me.addState( 'hover' );
            }
        };
    },
    
    /**
     * 获取主元素out的鼠标事件handler
     * 
     * @protected
     * @return {Function}
     */
    __getMainOutHandler: function () {
        var me = this;
        return function () {
            if ( !me._state[ 'disabled' ] ) {
                me.removeState( 'hover' );
                me.removeState( 'press' );
            }
        };
    },
    
    /**
     * 获取主元素down的鼠标事件handler
     * 
     * @protected
     * @return {Function}
     */
    __getMainDownHandler: function () {
        var me = this;
        return function () {
            if ( !me._state[ 'disabled' ] ) {
                me.addState( 'press' );
            }
        };
    },
    
    /**
     * 获取主元素up的鼠标事件handler
     * 
     * @protected
     * @return {Function}
     */
    __getMainUpHandler: function () {
        var me = this;
        return function () {
            if ( !me._state[ 'disabled' ] ) {
                me.removeState( 'press' );
            }
        };
    },
    
    /**
     * 预置状态表
     * 
     * @protected
     */
    _STATES: [ 
        'hover', 
        'press', 
        'active', 
        'disabled', 
        'readonly', 
        'focus'
    ],
    
    /**
     * 验证控件的值是否合法
     *
     * @public
     * @return {boolean}
     */
    validate: function () {
        if ( !this.rule ) {
            return !!1;
        }
        
        return esui.util.validate( this, this.rule );
    }
};  
