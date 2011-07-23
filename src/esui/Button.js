/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2011 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Button.js
 * desc:    按钮控件
 * author:  erik, zhaolei
 */

///import esui.Control;
///import baidu.lang.inherits;

/**
 * 按钮控件
 * 
 * @param {Object} options 控件初始化参数
 */
esui.Button = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'button';
    
    // 标识鼠标事件触发自动状态转换
    this._autoState = 1;

    esui.Control.call( this, options );
};

esui.Button.prototype = {
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
        
        return esui.util.format(
            me._tplButton,
            me.content || '&nbsp;',
            me.__getClass( 'label' ),
            me.__getId( 'label' )
        );
    },

    /**
     * 设置是否为Active状态
     * 
     * @public
     * @param {boolean} active active状态
     */
    setActive: function ( active ) {
        var state = 'active';

        if ( active ) {
            this.setState( state );
        } else {
            this.removeState( state );
        }
    },
    
    /**
     * 渲染控件
     * 
     * @public
     */
    render: function () {
        var me   = this;
        var main = me.main;
        var innerDiv;
        
        if ( !me._isRendered ) {
            innerDiv = main.firstChild;
            if (!me.content 
                && innerDiv 
                && innerDiv.tagName != 'DIV'
            ) {
                me.content = main.innerHTML;
            }
            
            esui.Control.prototype.render.call( me );
            main.innerHTML = me._getMainHtml();

            // 初始化状态事件
            main.onclick = me._getHandlerClick();

            me._isRendered = true;
        }

        // 设定宽度
        me.width && (main.style.width = me.width + 'px');
        
        // 设置disabled
        me.setDisabled( me.disabled );
    },
    
    /**
     * 获取按钮点击的事件处理程序
     * 
     * @private
     * @return {function}
     */
    _getHandlerClick: function() {
        var me = this;
        return function ( e ) {
            if ( !me.isDisabled() ) {
                me.onclick();
            }
        };
    },
    
    /**
     * 设置按钮的显示文字
     * 
     * @public
     * @param {string} content 按钮的显示文字
     */
    setContent: function ( content ) {
        baidu.g( this.__getId( 'label' ) ).innerHTML = content;
    }
};

baidu.inherits( esui.Button, esui.Control );
