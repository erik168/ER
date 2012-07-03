/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/BoxControl.js
 * desc:    选择框控件基类
 * author:  zhaolei, erik
 */

///import esui.InputControl;
///import esui.BoxGroup;
///import baidu.lang.inherits;
///import baidu.string.encodeHTML;
///import baidu.dom.insertAfter;
///import baidu.array.contains;

/**
 * 选择框控件基类
 * 
 * @description 不直接使用，供CheckBox和Radio继承
 * @param {Object} options 控件初始化参数
 */
esui.BoxControl = function ( options ) {
    // 标识鼠标事件触发自动状态转换
    this._autoState = 1;

    esui.InputControl.call( this, options );
};

esui.BoxControl.prototype = {
    onclick: new Function(),
    
    /**
     * 获取控件类型，checkbox|radio
     * 
     * @public
     * @return {string}
     */
    getType: function () {
        return this._type;
    },

    /**
     * 设置选中状态
     * 
     * @public
     * @param {boolean} checked 状态
     */
    setChecked: function ( checked ) {
        this.main.checked = !!checked;
    },
    
    /**
     * 获取选中状态
     * 
     * @public
     * @return {boolean}
     */
    isChecked: function() {
        return this.main.checked;
    },
    
    /**
     * 设置box为不可用状
     * 
     * @public
     */
    disable: function () {
        this.main.disabled = true;
        this.disabled = true;

        esui.InputControl.prototype.disable.call( this );
    },

    /**
     * 设置box为不可用状
     * 
     * @public
     */
    enable: function () {
        this.main.disabled = false;
        this.disabled = false;

        esui.InputControl.prototype.enable.call( this );
    },
    
    /**
     * 设置box的只读状态
     * 
     * @public
     */
    setReadOnly: function ( readOnly ) {
        this.main.disabled = readOnly;
        readOnly ? this.addState( 'readonly' ) : this.removeState( 'readonly' );
    },
    
    /**
     * 获取分组
     * 
     * @public
     * @return {esui.BoxGroup}
     */
    getGroup: function() {
        return new esui.BoxGroup( {
            name    : this.name, 
            type    : this._type,
            control : this
        } );
    },
    
    /**
     * 设置值
     * 
     * @public
     * @param {string} value
     */
    setValue: function( value ) {
        this.main.setAttribute( 'value', value );
    },
    
    /**
     * 获取值
     * 
     * @public
     * @return {string}
     */
    getValue: function() {
        return this.main.getAttribute( 'value' ) || 'on';
    },
    
    /**
     * 渲染控件
     *
     * @public
     */
    render: function () {
        var me   = this,
            main = me.main,
            data = me.datasource,
            title,
            label,
            value;
        
        esui.InputControl.prototype.render.call( me );
        
        // 初始化click事件
        if ( !me._mainClick ) {
            me._mainClick = me.__getClickHandler();
            main.onclick  = me._mainClick;
        }

        // 插入点击相关的label元素
        if ( !me._label ) {
            label = document.createElement( 'label' );
            label.className = me.__getClass( 'label' );
            baidu.setAttr( label, 'for', main.id );

            baidu.dom.insertAfter( label, main );
            me._label = label;
        } else {
            label = me._label;
        }

        // 初始化label的内容
        title = me.title || main.title || me.getValue();
        label.innerHTML = baidu.encodeHTML( title );
        
        // 初始化disabled
        me.setDisabled ( !!me.disabled );

        // 初始化value
        me.value && me.setValue( me.value );
        value = me.getValue();
        
        // 初始化checked
        switch ( typeof data ) {
        case 'string':
        case 'number':
            me.setChecked( data == value );
            break;

        default:
            if ( data instanceof Array ) {
                me.setChecked( baidu.array.contains( data, value ) );
            }
            break;
        }
    },
    
    /**
     * 获取click事件handler
     *
     * @protected
     */
    __getClickHandler: function() {
        var me = this;
        return function ( e ) {
            if ( !me.isDisabled() ) {
                me.onclick( e );
            }
        };
    },

    /**
     * 释放控件
     * 
     * @protected
     */
    __dispose: function () {
        this.onclick    = null;
        this._mainClick = null;
        this._label     = null;

        esui.InputControl.prototype.__dispose.call( this );
    },

    /**
     * 创建控件主元素
     *
     * @protected
     * @return {HTMLInputElement}
     */
    __createMain: function () {
        return esui.InputControl.prototype.__createInput.call( this, {
            tagName : 'input',
            name    : this.name,
            type    : this.type
        } );
    }
};

baidu.inherits( esui.BoxControl, esui.InputControl );
