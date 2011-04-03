/*
 * esui (ECOM Simple UI)
 * Copyright 2011 Baidu Inc. All rights reserved.
 * 
 * path:    ui/TextInput.js
 * desc:    文本输入框控件
 * author:  erik
 * date:    2011/01/18
 */

/**
 * 文本输入框组件
 * 
 * @param {Object} options 控件初始化参数
 */
ui.TextInput = function (options) {
	this.__initOptions(options);

    this.value = this.value || '';
};

ui.TextInput.prototype = {
	/**
	 * 获取文本输入框的值
	 * 
	 * @public
	 * @return {string}
	 */
	getValue: function () {
        var value = this._main.value;
        if ( this._placing ) {
            return '';
        }
		return value;
	},
	
    /**
     * 设置文本输入框的值
     * 
     * @public
     * @param {string} value
     */
	setValue: function (value) { 
        var main = this._main;
        var virClass = this.__getClass('virtual');
        var placeholder = this.placeholder;
        
        this._removeInputListener();
        main.value = value;
        if (value) {
            this._placing = 0;
            baidu.removeClass(main, virClass);
        } else if (placeholder) {
            this._placing = 1;
            main.value = placeholder;
            baidu.addClass(main, virClass);
        }
        this._addInputListener();
    },
    
    /**
     * 设置输入控件的title提示
     * 
     * @public
     * @param {string} title
     */
    setTitle: function (title) {
        this._main.setAttribute('title', title);
    },
    
    /**
     * 将文本框设置为不可写
     * 
     * @public
     */
    disable: function (disabled) {
        if (disabled) {
            this.setState('disabled');
        } else {
            this.removeState('disabled');
        }
        this._main.disabled = disabled;
    },
    
    /**
     * 设置控件为只读
     * 
     * @public
     * @param {Object} readOnly
     */
    setReadOnly: function (readOnly) {
        readOnly = !!readOnly;
        this._main.readOnly = readOnly;
        this.readOnly = readOnly;
        readOnly ? this.setState('readonly') : this.removeState('readonly');
    },
    
    /**
     * 渲染控件
     * 
     * @public
     * @param {Object} main 控件挂载的DOM
     */
    render: function (main) {
        var me = this;

        if ( !me._isRender ) {
            var tagName = main.tagName,
                inputType = main.getAttribute('type');
                
            // 判断是否input或textarea输入框
            if ((tagName == 'INPUT' && (inputType == 'text' || inputType == 'password'))
                || tagName == 'TEXTAREA'
            ) {
                // 初始化type用于样式
                me._type = tagName == 'INPUT' ? 'text' : 'textarea'; 
                
                // 设置formName
                me.formName = main.getAttribute('name');
                
                // 绘制控件行为
                ui.Base.render.call(me, main, true);

                // 绑定事件
                main.onkeypress = me._getPressHandler();
                me._addInputListener();
                
                main.onfocus = me._getFocusHandler();
                main.onblur = me._getBlurHandler();
                
                me._isRender = 1;
            }
        }
        
        main = me._main;
        if ( !main ) {
            return;
        }

        // 设置readonly和disabled状态
        me.setReadOnly( !!me.readOnly );
        me.disable( !!me.disabled );

        // 绘制宽高
        me.width && (main.style.width = me.width + 'px');
        me.height && (main.style.height = me.height + 'px');

        // 刷新输入框的value
        me.setValue(me.value);
    },
    
    /**
     * 添加控件oninput事件的监听器
     * 
     * @private
     */
    _addInputListener: function () {
        var changeHandler = this._changeHandler || this._getChangeHandler();
        var main = this._main;

        if (baidu.ie) {
            main.onpropertychange = changeHandler;
        } else {
            baidu.on(main, 'input', changeHandler);
        }
        this._changeHandler = changeHandler;
    },
    
    /**
     * 移除控件oninput事件的监听器
     * 
     * @private
     */
    _removeInputListener: function () {
        var changeHandler = this._changeHandler;
        var main = this._main;

        if (baidu.ie) {
            main.onpropertychange = null;
        } else {
            changeHandler && baidu.un(main, 'input', changeHandler);
        }
    },

    /**
     * 获取获焦事件处理函数
     * 
     * @private
     * @return {Function}
     */
    _getFocusHandler: function () {
        var me = this;
            
        return function () {
            var main = me._main;
            
            baidu.removeClass(main, me.__getClass('virtual'));
            if ( me._placing ) {
                main.value = '';
            }

            if ( me.autoSelect ) {
                main.select();
            }

            me.onfocus && me.onfocus();
        };
    },
    
    /**
     * 获取失焦事件处理函数
     * 
     * @private
     * @return {Function}
     */
    _getBlurHandler: function () {
        var me = this;
            
        return function () {
            me.setValue(me._main.value);
            me.onblur && me.onblur();
        };
    },
    
    /**
     * 获取键盘敲击的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getPressHandler: function () {
        var me = this;
        return function (e) {
            e = e || window.event;
            var keyCode = e.keyCode || e.which;
            
            if (me._type != 'text') {
                return;
            }
            
            if (keyCode == 13) {
                this.blur();
                me._getBlurHandler()();
                return me.onenter();
            }
        };
    },
    
    onenter: new Function(),
    
    /**
     * 获取输入框value发生改变的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getChangeHandler: function() {
        var me = this;
        return function (e) {
            if (baidu.ie) {
                var evt = window.event;
                if (evt.propertyName == 'value') {
                    me.onchange();
                }
            } else {       
                me.onchange();
            } 
        }
    },
    
    onchange: new Function(),

    /**
     * 获焦并选中文本
     * 
     * @public
     */
    select: function () {
        this._main.select();
    },
    
    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        // 卸载main的事件
        var main = this._main;
        main.onkeypress = null;
        main.onchange = null;
        main.onfocus = null;
        main.onblur = null;

        this._removeInputListener()
        this._changeHandler = null;

        ui.Base.dispose.call(this);
    }
};

ui.BaseInput.derive(ui.TextInput);
