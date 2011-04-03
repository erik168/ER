/*
 * esui (ECOM Simple UI)
 * Copyright 2011 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Button.js
 * desc:    按钮控件
 * author:  erik, zhaolei
 * date:    2011/01/19
 */

/**
 * 按钮控件
 * 
 * @param {Object} options 控件初始化参数
 */
ui.Button = function (options) {
    // 初始化参数
    this.__initOptions(options);
    
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'button';
};

ui.Button.prototype = {
    /**
     * button的html模板
     *
     * @private
     */
    _tplButton: '<div id="{2}" class="{1}">{0}</div>',
    
    /**
     * 默认的onclick事件执行函数
     * 不做任何事，容错
     * @public
     */
    onclick: new Function(),
    
    /**
     * 获取button主区域的html
     *
     * @private
     * @return {string}
     */
    _getMainHtml: function() {
        var me = this;
        
        return ui._format(
            me._tplButton,
            me.content || '&nbsp;',
            me.__getClass('label'),
            me.__getId('label')
        );
    },
    
    /**
     * 设置是否不可用
     * 
     * @public
     * @param {boolean} stat 状态
     */
    disable: function (stat) {
        var state = 'disabled';

        if (stat) {
            this.setState(state);
        } else {
            this.removeState(state);
        }
    },

    /**
     * 设置是否为Active状态
     * 
     * @protected
     * @param {boolean} stat 状态
     */
    active: function (stat) {
        var state = 'active';

        if (stat) {
            this.setState(state);
        } else {
            this.removeState(state);
        }
    },
    
    /**
     * 渲染控件
     * 
     * @param {HTMLElement} main 控件挂载的DOM
     */
    render: function (main) {
        var me = this, 
            innerDiv;
        
        if ( !me._isRender ) {
            innerDiv = main.firstChild;
            if (!me.content 
                && innerDiv 
                && innerDiv.tagName != 'DIV'
            ) {
                me.content = main.innerHTML;
            }
            
            ui.Base.render.call(me, main, true);
            main.innerHTML = me._getMainHtml();

            // 初始化状态事件
            main.onclick = me._getHandlerClick();

            me._isRender = 1;
        }

        // 设定宽度
        me.width && (main.style.width = me.width + 'px');
        
        // 设置disabled
        me.disable(me.disabled);
    },
    
    /**
     * 将控件添加到某个dom元素中
     * 
     * @param {HTMLElement} wrap 目标dom
     */
    appendTo: function (wrap) {
        if (this._main) {
            return;
        }

        var main = document.createElement('div');
        wrap.appendChild(main);
        this.render(main);
    },
    
    /**
     * 获取按钮点击的事件处理程序
     * 
     * @private
     * @return {function}
     */
    _getHandlerClick: function() {
        var me = this;
        return function (e) {
            if ( !me.getState( 'disabled' ) ) {
                me.onclick();
            }
        }
    },
    
    /**
     * 设置按钮的显示文字
     * 
     * @public
     * @param {string} content 按钮的显示文字
     */
    setContent: function (content) {
        baidu.g(this.__getId('label')).innerHTML = content;
    },
    
    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        this._main.onclick = null;
        ui.Base.dispose.call(this);
    }
};

ui.BaseInput.derive(ui.Button);
