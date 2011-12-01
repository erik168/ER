/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Layer.js
 * desc:    浮动面板层
 * author:  erik
 */

///import esui.Control;
///import baidu.lang.inherits;
///import baidu.event.on;
///import baidu.event.un;
///import baidu.event.getTarget;

/**
 * 浮动面板层控件
 * 
 * @param {Object} options 参数
 */
esui.Layer = function ( options ) {
    esui.Control.call( this, options );

    // 类型声明，用于生成控件子dom的id和class
    this._type = this.retype || 'layer';
    
    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;

    this.top = 0;
    this.left = 0;
    this.autoHide = this.autoHide || '';
};

esui.Layer.prototype = {
    /**
     * 绘制控件
     *
     * @public
     * @param {HTMLElement} main 控件挂载的DOM
     */
    render: function () {
        var main = this.main;
        esui.Control.prototype.render.call( this );

        main.style.position = 'absolute';
        main.style.left     = this._HIDE_POS;
        main.style.top      = this._HIDE_POS;
        this.zIndex && ( main.style.zIndex = this.zIndex );
        this.width  && ( main.style.width  = this.width + 'px' );
        this.height && ( main.style.height = this.height + 'px' );
        
        // 初始化autohide行为
        if ( this._autoHideInited ) {
            return;
        }

        switch ( this.autoHide.toLowerCase() ) {
        case 'click':
            this._clickHandler = this._getClickHider();
            baidu.on( document, 'click', this._clickHandler );
            break;
        case 'out':
            main.onmouseout = this._getOutHandler();
            main.onmouseover = this._getOverHandler();
            break;
        }

        this._autoHideInited = 1;
    },
    
    /**
     * 获取部件的css class
     * 
     * @override
     * @return {string}
     */
    __getClass: function ( name ) {
        name = name || this.partName;

        return esui.Control.prototype.__getClass.call( this, name );
    },
    
    /**
     * 获取鼠标移入的事件handler
     *
     * @private
     * @return {Function}
     */
    _getOverHandler: function () {
        var me = this;
        return function () {
            me.show();
        };
    },
    
    /**
     * 获取鼠标移出的事件handler
     *
     * @private
     * @return {Function}
     */
    _getOutHandler: function () {
        var me = this;
        return function () {
            me.onhide();
            me.hide();
        };
    },
    
    onhide: new Function(),

    /**
     * 获取点击自动隐藏的处理handler
     *
     * @private
     * @return {Function}
     */
    _getClickHider: function () {
        var me = this;
        return function ( e ) {
            if ( me._isHidePrevent ) {
                me._isHidePrevent = 0;
                return;
            }

            var tar = baidu.event.getTarget( e );
            while ( tar && tar != document.body ) {
                if ( tar == me.main ) {
                    return;
                }
                tar = tar.parentNode;
            }
            
            me.onhide();
            me.hide();
        };
    },

    /**
     * 在一次点击中阻止隐藏层
     * 
     * @private
     */
    _preventHide: function () {
        this._isHidePrevent = 1;
    },

    _HIDE_POS: '-10000px',
    
    /**
     * 设置浮动层的宽度
     *
     * @public
     * @param {number} width 宽度
     */
    setWidth: function ( width ) {
        this.main.style.width = width + 'px';
        this.width = width;
    },
    
    /**
     * 获取浮动层的宽度
     *
     * @public
     * @return {number}
     */
    getWidth: function () {
        return this.width || this.main.offsetWidth;
    },
    
    /**
     * 设置浮动层的高度
     *
     * @public
     * @param {number} height 高度
     */
    setHeight: function ( height ) {
        this.main.style.height = height + 'px';
        this.height = height;
    },
    
    /**
     * 获取浮动层的高度
     *
     * @public
     * @return {number}
     */
    getHeight: function () {
        return this.height || this.main.offsetHeight;
    },

    /**
     * 显示层
     * 
     * @public
     */
    show: function ( left, top ) {
        this._isShow = 1;
        this.left = left || this.left;
        this.top = top || this.top;
        
        this.main.style.left = this.left + 'px';
        this.main.style.top = this.top + 'px';
    },

    /**
     * 隐藏层
     * 
     * @public
     */
    hide: function () {
        this._isShow = 0;
        this.main.style.left = this._HIDE_POS;
        this.main.style.top = this._HIDE_POS;
    },
    
    /**
     * 获取层是否显示
     * 
     * @public
     * @return {boolean}
     */
    isShow: function () {
        return !!this._isShow;
    },
    
    /**
     * 释放控件
     * 
     * @private
     */
    __dispose: function () {
        var main = this.main;

        if ( this._clickHandler ) {
            baidu.un( document, 'click', this._clickHandler );
            this._clickHandler = null;
        }
        
        this.onhide = null;
        esui.Control.prototype.__dispose.call( this );
        
        main.innerHTML = '';
        main.parentNode && main.parentNode.removeChild( main );
    }
};

baidu.inherits( esui.Layer, esui.Control );
