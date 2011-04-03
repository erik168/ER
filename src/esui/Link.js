/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Link.js
 * desc:    链接控件
 * author:  zhaolei,erik
 * date:    $Date$
 */

/**
 * 链接控件
 * 
 * @param {Object} options 控件初始化参数
 */
ui.Link = function (options) {
    // 初始化参数
    this.__initOptions(options);
    
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'link';
};

ui.Link.prototype = {
    /**
     * 渲染控件
     * 
     * @public
     * @param {Object} main 控件挂载的DOM
     */
    render: function (main) {
        var me = this;
        ui.Base.render.call(me, main, true);
        
        if ( me._main ) {
            // NOTE 如果没有me.herf，就不需要给链接添加href属性了，否则
            // 就成了<a href="undefined"></a>了
            me.href && (me._main.href = me.href);
            me.text && (me._main.innerHTML = me.text);
            me.target && (me._main.target = me.target);
        }
        
        if ( !me._clickHandler ) {
            me._clickHandler = me._getClickHandler();
            me._main.onclick = me._clickHandler;
        }
    },
    
    /**
     * 将控件添加到某个dom元素中
     * 
     * @public
     * @param {HTMLElement} opt_wrap 目标dom
     */
    appendTo: function (wrap) {
        if (this._main) {
            return;
        }

        var main = document.createElement('a');
        wrap.appendChild(main);
        this.render(main);
    },
    
    onclick: new Function(),
    
    /**
     * 获取点击的handler
     * 
     * @private
     * @return {Function}
     */
    _getClickHandler: function() {
        var me = this;
        return function (e) {
            return me.onclick(e);
        };
    },
    
    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        this._clickHandler = null;
        this._main.onclick = null;
        ui.Base.dispose.call(this);
    }
};

ui.Base.derive(ui.Link);
