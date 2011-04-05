/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Layer.js
 * desc:    浮动面板层
 * author:  erik
 * date:    $Date: 2011-04-05 15:57:33 +0800 (二, 05  4 2011) $
 */


/**
 * 浮动面板层控件
 * 
 * @param {Object} options 参数
 */
ui.Layer = function(options) {
    this.__initOptions(options);
    this._type = this.retype || 'layer';

    this.top = 0;
    this.left = 0;
    this.autoHide = this.autoHide || '';
    this._controlMap = {};
};

ui.Layer.prototype = {
    /**
     * 绘制控件
     *
     * @public
     * @param {HTMLElement} main 控件挂载的DOM
     */
    render: function (main) {
        if (this._main || !main) {
            return;
        }
        
        ui.Base.render.call(this, main);
        main.style.position = 'absolute';
        main.style.left     = this._HIDE_POS;
        main.style.top      = this._HIDE_POS;
        main.style.zIndex   = this.zIndex || '90000';
        this.width  && (main.style.width = this.width + 'px');
        this.height && (main.style.height = this.height + 'px');
        
        
        switch (this.autoHide.toLowerCase()) {
        case 'click':
            this._clickHandler = this._getClickHider();
            baidu.on(document, 'click', this._clickHandler);
            break;
        case 'out':
            main.onmouseout = this._getOutHandler();
            main.onmouseover = this._getOverHandler();
            break;
        }
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

    /**
     * 将控件添加到某个dom元素中
     * 
     * @param {HTMLElement} opt_wrap 目标dom
     */
    appendTo: function (opt_wrap) {
        opt_wrap = opt_wrap || document.body;
        var main = document.createElement('div');
        this.render(main);
        opt_wrap.appendChild(main);
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
        return function (e) {
            if (me._isHidePrevent) {
                me._isHidePrevent = 0;
                return;
            }

            var tar = baidu.event.getTarget(e);
            while (tar && tar != document.body) {
                if (tar == me._main) {
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
    setWidth: function (width) {
        this._main.style.width = width + 'px';
        this.width = width;
    },
    
    /**
     * 获取浮动层的宽度
     *
     * @public
     * @return {number}
     */
    getWidth: function () {
        return this.width || this._main.offsetWidth;
    },
    
    /**
     * 设置浮动层的高度
     *
     * @public
     * @param {number} height 高度
     */
    setHeight: function (height) {
        this._main.style.height = height + 'px';
        this.height = height;
    },
    
    /**
     * 获取浮动层的高度
     *
     * @public
     * @return {number}
     */
    getHeight: function () {
        return this.height || this._main.offsetHeight;
    },

    /**
     * 显示层
     * 
     * @public
     */
    show: function (left, top) {
        this._isShow = 1;
        this.left = left || this.left;
        this.top = top || this.top;
        
        this._main.style.left = this.left + 'px';
        this._main.style.top = this.top + 'px';
    },

    /**
     * 隐藏层
     * 
     * @public
     */
    hide: function () {
        this._isShow = 0;
        this._main.style.left = this._HIDE_POS;
        this._main.style.top = this._HIDE_POS;
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
     * @public
     */
    dispose: function () {
        var me = this;
        var main = me._main;

        if (me._clickHandler) {
            baidu.un(document, 'click', me._clickHandler);
            me._clickHandler = null;
        }
        
        me.onhide = null;
        main.onmouseover = null;
        main.onmouseout = null;
        main.parentNode.removeChild(main);

        ui.Base.dispose.call(me);
        
        main.innerHTML = '';
        main.parentNode && main.parentNode.removeChild(main);
    }
};

ui.Base.derive(ui.Layer);
