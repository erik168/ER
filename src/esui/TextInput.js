/*
 * esui (ECOM Simple UI)
 * Copyright 2011 Baidu Inc. All rights reserved.
 * 
 * path:    esui/TextInput.js
 * desc:    文本输入框控件
 * author:  erik
 */

///import esui.InputControl;
///import baidu.lang.inherits;
///import baidu.dom.addClass;
///import baidu.dom.removeClass;
///import baidu.event.on;
///import baidu.event.un;

/**
 * 文本输入框组件
 * 
 * @param {Object} options 控件初始化参数
 */
esui.TextInput = function ( options ) {
    // 标识鼠标事件触发自动状态转换
    this._autoState = 1;

    esui.InputControl.call( this, options );
    
    // 初始化value
    this.value = this.value || '';

    // 初始化mode
    if ( this.mode && this.mode != 'textarea' && this.mode != 'password' && this.mode != 'hidden') {
        this.mode = 'text';
    }
};

esui.TextInput.prototype = {
    /**
     * 设置输入控件的title提示
     * 
     * @public
     * @param {string} title
     */
    setTitle: function ( title ) {
        this.main.setAttribute( 'title', title );
    },
    
    /**
     * 将文本框设置为禁用
     * 
     * @public
     */
    disable: function () {
        this.main.disabled = true;
        esui.InputControl.prototype.disable.call( this );
    },

    /**
     * 将文本框设置为可用
     * 
     * @public
     */
    enable: function () {
        this.main.disabled = false;
        esui.InputControl.prototype.enable.call( this );
    },

    /**
     * 设置控件为只读
     * 
     * @public
     * @param {Object} readOnly
     */
    setReadOnly: function ( readOnly ) {
        readOnly = !!readOnly;
        this.main.readOnly = readOnly;
        this.readOnly = readOnly;
        readOnly ? this.addState('readonly') : this.removeState('readonly');
    },
    
    /**
     * 设置控件的高度
     *
     * @public
     * @param {number} height 高度
     */
    setHeight: function ( height ) {
        this.height = height;
        height && (this.main.style.height = height + 'px');
    },
    
    /**
     * 设置控件的宽度
     *
     * @public
     * @param {number} width 宽度
     */
    setWidth: function ( width ) {
        this.width = width;
        width && (this.main.style.width = width + 'px');
    },
    
    /**
     * 获焦并选中文本
     * 
     * @public
     */
    select: function () {
        this.main.select();
    },

    /**
     * 获取文本输入框的值
     * 
     * @public
     * @return {string}
     */
    getValue: function () {
        var value = this.main.value;
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
    setValue: function ( value ) { 
        value = (value !== null && typeof value != 'undefined') ? (value + '') : '';

        var main        = this.main;
        var placeholder = this.placeholder;
        
        // 移除输入事件的处理，设置后再重新挂载
        // ie下setValue会触发propertychange事件
        this._removeInputListener();
        this._removeBlurChangeListener();
        
        var needPlacing = !value && this.needPlacing();
        this.setPlacing(needPlacing);
        main.value = needPlacing ? placeholder : value;
        
        // 重新挂载输入事件的处理
        this._addInputListener();
        this._addBlurChangeListener();
    },

    
    /**
     * 渲染控件
     * 
     * @public
     * @param {Object} main 控件挂载的DOM
     */
    render: function () {
        var me      = this;
        var main    = me.main;
        
        if ( !me._isRendered ) {
            esui.InputControl.prototype.render.call( me );

            // 绑定事件
            main.onkeypress = me._getPressHandler();
            me._addInputListener();
            
            // 移除press状态的自动切换器
            main.onmousedown = null;
            main.onmouseup = null;

            // 挂载获焦和失焦事件处理
            main.onfocus = me._getFocusHandler();
            main.onblur = me._getBlurHandler();
            
            me._addBlurChangeListener();

            me._isRendered = 1;
        }

        // 设置readonly和disabled状态
        me.setReadOnly( !!me.readOnly );
        me.setDisabled( !!me.disabled );

        // 绘制宽高
        me.setWidth( me.width );
        me.setHeight( me.height );

        // 刷新输入框的value
        me.setValue( me.value );
    },
    
    /**
     * 设置是否使用替代提示文本
     * @param {Boolean} place
     */
    setPlacing: function (place) {
        var virClass    = this.__getClass( 'virtual' );
        this._placing = place | 0;
        baidu[place ? 'addClass' : 'removeClass']( this.main, virClass );
    },
    
    
    /**
     * 判断是否需要替代文本
     * @return {Boolean}
     */
    needPlacing: function () {
        var placeholder = this.placeholder,
            value = this.main.value;
        return placeholder && (!value || value == placeholder);
    },
    
    /**
     * 添加控件oninput事件的监听器
     * 
     * @private
     */
    _addInputListener: function () {
        var main = this.main;
        var changeHandler = this._changeHandler;

        if ( !changeHandler ) {
            changeHandler = this._getChangeHandler();
            this._changeHandler = changeHandler;
        }
        
        if ( baidu.ie ) {
            main.onpropertychange = changeHandler;
        } else {
            baidu.on( main, 'input', changeHandler );
        }
    },
    
    /**
     * 移除控件oninput事件的监听器
     * 
     * @private
     */
    _removeInputListener: function () {
        var changeHandler = this._changeHandler;
        var main = this.main;

        if ( baidu.ie ) {
            main.onpropertychange = null;
        } else {
            changeHandler && baidu.un( main, 'input', changeHandler );
        }
    },
    
    /**
     * 添加控件onchange事件的监听器
     * 
     * @private
     */
    _addBlurChangeListener: function () {
        var blurChanger = this._blurChangeHandler;
        if (!blurChanger) {
            blurChanger = this._blurChangeHandler = this._getBlurChangeHandler();
        }
        
        this.main.onchange = blurChanger;
    },
    
    /**
     * 移除控件onchange事件的监听器
     * 
     * @private
     */
    _removeBlurChangeListener: function () {
        this.main.onchange = null;
    },
    
    onfocus: new Function(),

    /**
     * 获取获焦事件处理函数
     * 
     * @private
     * @return {Function}
     */
    _getFocusHandler: function () {
        var me = this;
            
        return function () {
            var main = me.main;
            
            baidu.removeClass( main, me.__getClass( 'virtual' ) );
            if ( me._placing ) {
                me._placing = 1;
                main.value = '';
            }

            if ( me.autoSelect ) {
                main.select();
            }

            me.onfocus();
        };
    },
    
    onblur: new Function(),

    /**
     * 获取失焦事件处理函数
     * 
     * @private
     * @return {Function}
     */
    _getBlurHandler: function () {
        var me = this;
            
        return function () {
            me.setPlacing(me.needPlacing());
            me.onblur();
        };
    },
    
    onenter: new Function(),

    /**
     * 获取键盘敲击的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getPressHandler: function () {
        var me = this;
        return function ( e ) {
            e = e || window.event;
            var keyCode = e.keyCode || e.which;
            
            if ( me._type != 'text' ) {
                return;
            }
            
            if ( keyCode == 13 ) {
                return me.onenter();
            }
        };
    },
    
    onchange: new Function(),
    oninput: new Function(),
    
    /**
     * 获取输入框value发生改变的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getChangeHandler: function() {
        var me = this;
        return function ( e ) {
            if ( baidu.ie && window.event.propertyName == 'value' || !baidu.ie) {
                me.oninput();
            }
        };
    },
    
    _getBlurChangeHandler: function () {
        var me = this;
        return function (ev) {
            me.onchange();
        };
    },
    
    /**
     * 构造控件
     *
     * @protected
     */
    __construct: function () {
        esui.InputControl.prototype.__construct.call( this );
        
        var me      = this;
        var main    = me.main;
        var tagName = main.tagName;
        var tagType = main.getAttribute( 'type' );

        // 判断输入框的mode
        var mode = '';
        switch ( tagName ) {
        case 'TEXTAREA':
            mode = 'textarea';
            break;
        case 'INPUT':
            switch ( tagType ) {
            case 'text':
            case 'password':
            case 'hidden':
                mode = tagType;
                break;
            }
            break;
        }

        if ( !mode ) {
            throw new Error( "esui.TextInput: invalid main element!" );
        }

        me.mode = me.mode || mode;

        // 类型声明，用于生成控件子dom的id和class
        me._type = me.mode == 'textarea' ? 'textarea' : 'text';

        me.value = me.value || main.value;
        me.placeholder = me.placeholder || main.getAttribute( 'placeholder' );
        main.setAttribute( 'placeholder', '' );
    },

    /**
     * 释放控件
     * 
     * @protected
     */
    __dispose: function () {
        // 卸载main的事件
        var main = this.main;
        main.onkeypress = null;
        main.onchange = null;
        main.onfocus = null;
        main.onblur = null;

        this._removeInputListener();
        this._changeHandler = null;

        esui.InputControl.prototype.__dispose.call( this );
    },
    
    /**
     * 创建控件主元素
     *
     * @protected
     * @return {HTMLInputElement}
     */
    __createMain: function () {
        var creater = esui.InputControl.prototype.__createInput;
        var mode    = this.mode;
        mode        = mode || 'text';

        if ( mode == 'text' || mode == 'password' ) {
            return creater.call( this, {
                tagName : 'input',
                name    : this.name,
                type    : mode
            } );
        } else {
            return creater.call( this, {
                tagName : 'textarea',
                name    : this.name
            } );
        }
    }
};

baidu.inherits( esui.TextInput, esui.InputControl );
