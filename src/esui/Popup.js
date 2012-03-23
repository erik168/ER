/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Dialog.js
 * desc:    对话框控件
 * author:  zhaolei, erik, linzhifeng
 */

///import esui.Control;
///import esui.Layer;
///import esui.Mask;
///import baidu.lang.inherits;
///import baidu.dom.draggable;
///import baidu.event.on;
///import baidu.event.un;

/**
 * 对话框控件
 * 
 * @param {Object} options 控件初始化参数
 */
esui.Popup = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = this._type || 'popup';
    
    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;
    
    esui.Control.call( this, options );

    // 初始化自动定位参数
    this.__initOption('autoPosition', null, 'AUTO_POSITION');
    
    // 初始化可拖拽参数
    this.__initOption('draggable', null, 'DRAGGABLE');

    // 初始化宽度
    this.__initOption('width', null, 'WIDTH');

    // 初始化距离顶端的高度
    this.__initOption('top', null, 'TOP');
    this.top = parseInt( this.top, 10 );

    this._resizeHandler = this._getResizeHandler();
};

esui.Popup.prototype = {
    /**
     * 对话框主体和尾部的html模板
     * @private
     */
    _tplBF: '<div class="{1}" id="{0}">{2}</div>',
    
    /**
     * 显示对话框
     * 
     * @public
     */
    show: function () {
        var mask = this.mask;
        var main;
        if ( !this.getLayer() ) {
            this.render();            
        }

        main = this.getLayer().main;

        // 浮动层自动定位功能初始化
        if ( this.autoPosition ) {
            baidu.on( window, 'resize', this._resizeHandler );
        }
        
        this._resizeHandler();

        // 拖拽功能初始化
        if ( this.draggable ) {
            baidu.dom.draggable( main, {handler:this.getHead()} );
        }        
        
        // 如果mask不是object，则会隐式装箱
        // 装箱后的Object不具有level和type属性
        // 相当于未传参数
        mask && esui.Mask.show( mask.level, mask.type );
        
        this._isShow = true;
    },
    
    /**
     * 隐藏对话框
     * 
     * @public
     */
    hide: function () {
        if ( this._isShow ) {
            if ( this.autoPosition ) {
                baidu.un( window, 'resize', this._resizeHandler );
            }
            
            this.getLayer().hide();
            this.mask && esui.Mask.hide( this.mask.level );
        }

        this._isShow = 0;
    },
    
    /**
     * 获取浮出层控件对象
     * 
     * @public
     * @return {esui.Layer}
     */
    getLayer: function () {
        return this._controlMap.layer;
    },

    /**
     * 设置标题文字
     * 
     * @public
     * @param {string} html 要设置的文字，支持html
     */
    setTitle: function ( html ) {
        var el = baidu.g( this.__getId( 'title' ) );
        if ( el ) {
            el.innerHTML = html;
        }
        this.title = html;
    },

    /**
     * 设置内容
     *
     * @public
     * @param {string} content 要设置的内容，支持html.
     */
    setContent: function ( content ) {
        this.content = content;
        var main = this.getLayer().main;
        if (main) {
	        main.innerHTML = content;
	        // 改变内容后再次自适应位置
	        setTimeout(this._resizeHandler, 0);
	    }
    },

    
    /**
     * 获取页面resize的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getResizeHandler: function () {
        var me = this;
            
        return function () {
            var layer   = me.getLayer(),
                main    = layer.main,
                left    = me.left,
                top     = me.top,
                doc     = document.body.parentNode;
            
            if ( !left ) {
                left = (doc.clientWidth - main.offsetWidth) / 2 + doc.scrollLeft;
            }
            if ( !top ) {
                top = (doc.clientHeight - main.offsetHeight) / 2 + doc.scrollTop;
            }
            
            if ( left < 0 ) {
                left = 0;
            }

            if ( top < 0 ) {
                top = 0;
            }
            
            layer.show( left, top );
        };
    },
    
    /**
     * 获取关闭按钮的点击handler
     *
     * @private
     * @return {Function}
     */
    _getCloseHandler: function () {
        var me = this;
        return function () {
            me.onhide();
            me.hide();
        };
    },
    
    onhide: new Function(),
        
    /**
     * 绘制对话框
     * 
     * @public
     */
    render: function () {
        var me      = this,
            layer   = me.getLayer();
        
        // 避免重复创建    
        if ( layer ) {
            return;
        }
        
        layer = me.createLayer(document.body);
        
        this.setContent(this.content || '');
    },
    
    createLayer: function (there) {
        var me = this;
        var layer = me._controlMap.layer = esui.util.create( 'Layer', {
            id      : me.__getId('layer'),
            retype  : me._type,
            skin    : me.skin + (me.dragable ? ' dragable' : ''),
            width   : me.width
        } );
        layer.appendTo(there);
        return layer;
    },
    
    /** 
     * dialog只允许在body下。重置appendTo方法
     *
     * @public
     */ 
    appendTo: function () {
        this.render();
    },

    /** 
     * dialog不需要创建main，方法置空
     *
     * @private
     */
    __createMain: function () {},

    /**
     * 释放控件
     * 
     * @private
     */
    __dispose: function () {
        if ( this.autoPosition ) {
            baidu.un( window, 'resize', this._resizeHandler );
        }

        this._resizeHandler = null;
        esui.Control.prototype.__dispose.call( this );
    }
};

baidu.inherits( esui.Popup, esui.Control );
