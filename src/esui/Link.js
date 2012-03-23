/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Link.js
 * desc:    链接控件
 * author:  zhaolei, erik
 */


///import esui.Control;
///import baidu.string.encodeHTML;
///import baidu.lang.inherits

/**
 * 链接控件
 * 
 * @class
 * @param {Object} options 控件初始化参数
 */
esui.Link = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'link';

    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;

    esui.Control.call( this, options );
};

esui.Link.prototype = {
    /**
     * 渲染控件
     * 
     * @public
     * @param {Object} main 控件挂载的DOM
     */
    render: function () {
        var me = this;
        esui.Control.prototype.render.call( me );
        
        // 设置各种属性
        me.href    && me.setHref( me.href );
        me.text    && me.setText( me.text );
        me.content && me.setContent( me.content );
        me.target  && me.setTarget( me.target );
        
        // 绑定点击事件处理
        if ( !me._clickHandler ) {
            me._clickHandler = me._getClickHandler();
            me.main.onclick = me._clickHandler;
        }
    },

    /**
     * 设置链接地址
     *
     * @public
     * @param {string} href 链接地址
     */
    setHref: function ( href ) {
        !href && ( href = '' );
        this.main.href = href;
    },

    /**
     * 设置链接显示文字。经过html encode
     *
     * @public
     * @param {string} text 显示文字
     */
    setText: function ( text ) {
        !text && ( text = '' );
        this.setContent( baidu.encodeHTML( text ) );
    },
    
    /**
     * 设置链接显示内容。不经过html encode
     *
     * @public
     * @param {string} content 链接显示内容
     */
    setContent: function ( content ) {
        !content && ( content = '' );
        this.main.innerHTML = content;
    },

    /**
     * 设置链接target
     *
     * @public
     * @param {string} target 链接target
     */
    setTarget: function ( target ) {
        !target && ( target = '' );
        this.main.target = target;
    },
    
    onclick: new Function(),
    
    /**
     * 生成控件主元素
     *
     * @protected
     * @return {HTMLElement}
     */
    __createMain: function () {
        return document.createElement( 'a' );
    },

    /**
     * 获取点击的handler
     * 
     * @private
     * @return {Function}
     */
    _getClickHandler: function() {
        var me = this;
        return function ( e ) {
            return me.onclick( e );
        };
    },
    
    /**
     * 销毁控件
     * 
     * @private
     */
    __dispose: function () {
        this._clickHandler = null;
        esui.Control.prototype.__dispose.call( this );
    }
};

baidu.inherits( esui.Link, esui.Control );

