/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Base.js
 * desc:    ui控件的基础功能
 * author:  erik, zhaolei 
 * date:    $Date$
 */

/**
 * ui控件的基础功能
 */
ui.Base = {
    /**
     * 通过派生实现通用控件的功能
     * 
     * @public
     * @param {Function} clazz 控件类
     */
    derive: function (clazz) {
        var methods = [
                '__getClass', 
                '__getId',
                '__initOption',
                '__initOptions',
                'dispose',
                'render',
                '__initStateChanger',
                '__getMainOverHandler',
                '__getMainOutHandler',
                '__getMainDownHandler',
                '__getMainUpHandler',
                'getMain',
                'getState',
                'setState',
                'removeState',
                '__getStrRef',
                '__getStrCall',
                'validate',
                '__ui__'],
            len = methods.length,
            proto = clazz.prototype,
            i = 0,
            method;
            
        for (; i < len; i++) {
            method = methods[i];
            if (!proto[method]) {
                proto[method] = ui.Base[method];
            }
        }

        // 修正组件的constructor
        proto.constructor = clazz;
    },
    
    /**
     * 控件标识
     *
     * @private
     */
    '__ui__': 1,

    /**
     * 初始化参数
     * 
     * @protected
     * @param {Object} options 参数集合
     */
    __initOptions: function (options) {
        for (var k in options) {
            this[k] = options[k];
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
    __initOption: function (name, opt_defaultValue, opt_configName) {
        if (!ui._hasValue(this[name])) {
            if ('string' == typeof opt_configName) {
                this[name] = this.constructor[opt_configName];
            } 
            
            if (!ui._hasValue(this[name])
                && ui._hasValue(opt_defaultValue)
            ) {
                this[name] = opt_defaultValue;
            } 
        }
    },
    

    /**
     * 获取dom子部件的css class
     * 
     * @protected
     * @return {string}
     */
    __getClass: function (name) {
        var me = this,
            type = me._type.toLowerCase(),
            className = 'ui-' + type,
            skinName = 'skin-' + type + '-' + me.skin;
        
        if (name) {
            className += '-' + name;
            skinName += '-' + name;
        }    
        
        if (me.skin) {
            className += ' ' + skinName;
        }
        
        return className;
    },
    
    /**
     * 获取dom子部件的id
     * 
     * @protected
     * @return {string}
     */
    __getId: function (name) {
        var idPrefix = 'ctrl' + this._type + this.id;
        if (name) {
            return idPrefix + name;
        }
        return idPrefix;
    },
    
    /**
     * 渲染控件
     * 
     * @public
     * @param {HTMLElement} main 控件挂载的DOM
     * @param {boolean} autoState 是否挂载自动状态转换的处理
     */
    render: function (main, autoState) {
        var me = this;
        if (!me._main) {
            me._main = main;
            main.id = me.__getId();
            main.setAttribute('control', me.id);
            baidu.addClass(main, me.__getClass());
            
            if (autoState) {
                me.__initStateChanger();
            }
        }    
    },
    
    /**
     * 获取控件主区域的dom元素
     * 
     * @public
     * @return {HTMLElement} 
     */
    getMain: function () {
        return this._main || null;
    },

    /**
     * 获取控件对象的全局引用字符串
     * 
     * @protected
     * @return {string}
     */
    __getStrRef: function () {
        return "ui.util.get('" + this.id + "')";
    },
    
    /**
     * 获取控件对象方法的全局引用字符串
     * 
     * @protected
     * @param {string} fn 调用的方法名
     * @param {Any...} anonymous 调用的参数
     * @return {string}
     */
    __getStrCall: function (fn) {
        var argLen = arguments.length,
            params = [],
            i, arg;
        if (argLen > 1) {
            for (i = 1; i < argLen; i++) {
                arg = arguments[i];
                if (typeof arg == 'string') {
                    arg = "'" + arg +"'";
                }
                params.push(arg);
            }
        }
        
        return this.__getStrRef()
                + '.' + fn + '('
                + params.join(',') 
                + ');'; 
    },
    
    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        var controlMap = this._controlMap,
            main = this._main;
        
        // dispose子控件
        if (controlMap) {
            for (var k in controlMap) {
                ui.util.dispose(controlMap[k].id);
                delete controlMap[k];
            }
        }
        this._controlMap = null;
        
        // 释放控件主区域的事件以及引用
        if (main) {
            main.onmouseover = null;
            main.onmouseout = null;
            main.onmousedown = null;
            main.onmouseup = null;
        }
        this._main = null;
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
            main = me._main;
        
        me._state = {};
        if (main) {
            main.onmouseover = me.__getMainOverHandler();
            main.onmouseout = me.__getMainOutHandler();
            main.onmousedown = me.__getMainDownHandler();
            main.onmouseup = me.__getMainUpHandler();
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
            if (!me._state['disabled']) {
                me.setState('hover');
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
            if (!me._state['disabled']) {
                me.removeState('hover');
                me.removeState('press');
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
        return function (e) {
            if (!me._state['disabled']) {
                me.setState('press');
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
            if (!me._state['disabled']) {
                me.removeState('press');
            }
        };
    },
    
    /**
     * 设置控件的当前状态
     * 
     * @public
     * @param {string} state 要设置的状态
     */
    setState: function (state) {
        if (!this._state) {
            this._state = {};
        }
        
        this._state[state] = 1;
        baidu.addClass(this._main, this.__getClass(state));
    },
    
    /**
     * 移除控件的当前状态
     * 
     * @public
     * @param {string} state 要移除的状态
     */
    removeState: function (state) {
        if (!this._state) {
            this._state = {};
        }
        
        delete this._state[state];
        baidu.removeClass(this._main, this.__getClass(state));
    },
    
    /**
     * 获取控件状态
     * 
     * @public
     * @param {string} state 要获取的状态
     * @return {boolean|Null}
     */
    getState: function (state) {
        if (!this._state) {
            this._state = {};
        }
        
        return !!this._state[state];
    },
    
    /**
     * 预置状态表
     * 
     * @protected
     */
    states: ['hover', 'press', 'active', 'disabled', 'readonly'],
    
    /**
     * 验证控件的值
     *
     * @public
     */
    validate: function () {
        if ( !this.rule ) {
            return !!1;
        }
        
        return ui.util.validate(this, this.rule);
    }
};  
