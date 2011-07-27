/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Label.js
 * desc:    标签显示控件
 * author:  erik, tongyao, yanjunyi
 */

///import esui.Control;
///import baidu.lang.inherits;

/**
 * 标签显示控件
 * 
 * @param {Object} options 控件初始化参数
 */
esui.Label = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'label';

    // 标识鼠标事件触发自动状态转换
    this._autoState = 1;

    esui.Control.call( this, options );
};

esui.Label.prototype = {
    /**
     * 渲染控件
     *
     * @public
     */
    render: function () {
        var me = this;
        
        esui.Control.prototype.render.call( me );
        
        if ( this.text ) {
            this.content = baidu.encodeHTML( this.text );
        }

        this.setContent( this.content );
        this.setTitle( this.title );
    },

    /**
     * 设置显示内容（不经过html编码）
     *
     * @public
     * @param {string} content
     */
    setContent: function ( content ) {
        this.content = content || '';
        this.main.innerHTML = this.content;
    },
    
    /**
     * 设置显示文字（经过html编码）
     *
     * @public
     * @param {string} text
     */
    setText: function ( text ) {
        text = text || '';
        this.setContent( baidu.encodeHTML( text ) );
    },
    
    /**
     * 设置自动提示的title
     *
     * @public
     * @param {string} title
     */
    setTitle: function ( title ) {
        this.title = title || '';
        this.main.setAttribute( 'title', this.title );
    },

    /**
     * 创建控件主元素
     *
     * @protected
     * @return {HTMLElement}
     */
    __createMain: function () {
        return document.createElement( 'span' );
    }
};

baidu.inherits( esui.Label, esui.Control );
