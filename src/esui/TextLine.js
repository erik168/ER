/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/TextLine.js
 * desc:    带行号的文本输入框控件
 * author:  zhouyu, erik
 */

///import esui.InputControl;
///import esui.TextInput;
///import baidu.lang.inherits;
///import baidu.string.trim;

/**
 * 带行号的文本输入框控件
 * 
 * @param {Object} options 参数
 */
esui.TextLine = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'textline';
   
    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;
    
    esui.InputControl.call( this, options );

    this.number = 1;
    
    this._numberId      = this.__getId( 'number' );
    this._textId        = this.__getId( 'text' );
    this._numberInnId   = this._numberId + 'Word';

    this.__initOption( 'height', null, 'HEIGHT' );
};

esui.TextLine.HEIGHT = 200;

esui.TextLine.prototype = {
    /**
     * 渲染控件
     *
     * @public
     */
    render: function () {
        var me = this;

        if ( !me._isRendered ) {
            esui.InputControl.prototype.render.call( me );
            
            me._renderMain();
            me._refreshLine();
            me._bindEvent();
            me._isRendered = 1;
        }
        
        // 绘制宽高
        me.setWidth( me.width );
        me.setHeight( me.height );

        // 写入value
        me.setValue( me.value );
    },
    
    /**
     * 显示行号区域
     *
     * @public
     */
    showNumber: function () {
        this._numberHidden = false;
        baidu.show( this._numberEl );

        this._resetLineWidth();
        this._resetScroll();
    },
    /**
     * 隐藏行号区域
     *
     * @public
     */
    hideNumber: function () {
        this._numberHidden = true;
        baidu.hide( this._numberEl );
        
        this._resetLineWidth();
    },

    /**
     * 设置控件的高度
     *
     * @public
     * @param {number} height 高度
     */
    setHeight: function ( height ) {
        this.height = height;
        
        if ( height ) {
            this._numberEl.style.height = this.main.style.height = height + 'px';
            this._controlMap.text.setHeight( height );
        }
    },

    /**
     * 设置控件的宽度
     *
     * @public
     * @param {number} width 宽度
     */
    setWidth: function ( width ) {
        this.width = width;
        
        if ( width ) {
            this.main.style.width = width + 'px';
            this._resetLineWidth();
        }
    },
    
    /**
     * 绑定事件
     *
     * @private
     */
    _bindEvent: function(){
        var me = this;

        var text = me._getTextCtrl();
        me._lineRefresher   = me._getLineRefresher();
        me._scrollRefresher = me._getScrollReseter();

        text.onchange           = me._lineRefresher;
        text.main.onscroll      = me._scrollRefresher;
        me._numberEl.onscroll   = me._getScrollLineReseter();
    },
    
    /**
     * 获取number行滚动条位置的重置器
     *
     * @private
     * @return {Function}
     */
    _getScrollLineReseter: function () {
        var me = this;
        return function () {
            me._resetScrollByLine();
        };
    },

    /**
     * 获取滚动条位置的重置器
     *
     * @private
     * @return {Function}
     */
    _getScrollReseter: function () {
        var me = this;
        return function () {
            me._resetScroll();
        };
    },
    
    /**
     * 获取行刷新的handler
     *
     * @private
     * @return {Function}
     */
    _getLineRefresher: function () {
        var me = this;

        return function () {
            var textEl = me._getTextEl();
            me._refreshLine();

            (typeof me.onchange == 'function') && me.onchange();
        };
    },
    
    _tpl: '<div id="{0}" class="{2}"><pre style="margin:0;border:0;padding:0;">1</pre></div>'
            + '<span id="{3}" class="{4}" style="left:-10000px;position:absolute;">1</span>'
            + '<textarea ui="type:TextInput;id:{1}"></textarea>',
    

    /**
     * 绘制主区域
     *
     * @private
     */
    _renderMain: function(){
        var me              = this;
        var main            = me.main;
        var numberId        = me._numberId;
        var textId          = me._textId;
        var numberInnId     = me._numberInnId;

        var propMap = {};
        var textCtrl;

        propMap[ textId ] = {
            width   : me.width,
            height  : me.height,
            value   : me.value
        };

        main.innerHTML = esui.util.format(
            me._tpl, 
            numberId, 
            textId,
            me.__getClass( 'number' ),
            numberInnId,
            me.__getClass( 'numberinner' )
        );
        me._controlMap.text = textCtrl = esui.util.init( main, propMap )[ textId ];

        // 移除text控件的hover状态自动触发
        textCtrl.main.onmouseover = null;
        textCtrl.main.onmouseout = null;

        me._numberEl = baidu.g( numberId );
        me._numberEl.style.height = me.height + "px";

        me._numberInnEl = baidu.g( numberInnId );
    },
    
    /**
     * 重置行号，增加内容和keyup时可调用
     *
     * @private
     */
    _refreshLine: function () {
        var me      = this;
        var html    = [];
        var num     = me._getTextCtrl()
                        .getValue()
                        .split( "\n" )
                        .length;
        var i;

        if ( num != me.number ) {
            me.number = num;
            for ( i = 1; i < num + 1; i++ ) {
                html.push( i );
            }

            me._numberInnEl.innerHTML = num + 1;
            
            // chrome下节点太多性能会慢：“1<br>2”是3个节点
            // IE下设置pre的innerHTML中，\n不会换行，很奇怪
            if ( baidu.ie ) {
                me._numberEl.innerHTML = html.join( "<br>" );
            } else {
                me._numberEl.firstChild.innerHTML = html.join( "\n" );
            }
            
            me._resetLineWidth();
        }

        me._resetScroll();
    },
    
    /**
     * 重置行号区域的宽度
     *
     * @private
     */
    _resetLineWidth: function () {
        var width       = Math.max( this._numberInnEl.offsetWidth, 14 );
        var left        = width + 12;
        var textWidth   = this.width - left;
    
        this._numberEl.style.width = width + 18 + 'px';

        if ( this._numberHidden ) {
            left        = 0;
            textWidth   = this.width;
        }

        this._getTextEl().style.left = left + 'px';
        this._getTextCtrl().setWidth( textWidth );
    },

    /**
     * 获取输入框元素
     *
     * @private
     * @return {HTMLElement}
     */
    _getTextEl: function () {
        return this._getTextCtrl().main;
    },

    /**
     * 获取输入框控件
     *
     * @private
     * @return {esui.TextInput}
     */
    _getTextCtrl: function () {
        return this._controlMap.text;
    },

    /**
     * 滚动文本输入框
     */
    _resetScroll: function () {
        var me = this;
        me._numberEl.scrollTop = me._getTextEl().scrollTop;
    },
    
    /**
     * 滚动数字区域
     */
    _resetScrollByLine: function () {
        var me = this;
        me._getTextEl().scrollTop = me._numberEl.scrollTop;
    },
    
    /**
     * 增加内容
     *
     * @public
     * @param {Array} lines
     */
    addLines: function ( lines ) {
        var me      = this;
        var text    = me._controlMap.text;
        var content = lines.join( '\n' );
        var value   = me.getValue();

        if ( value.lenght > 0 ) {
            content = value + '\n' + content;
        }

        text.setValue( content );
    },
    
    /**
     * 设置内容字符串形式
     *
     * @public
     * @param {string} value
     */
    setValue: function ( value ) {
        var text = this._getTextCtrl();
        text.setValue( value );

        this._refreshLine();
    },
    
    /**
     * 获取内容字符串形式
     *
     * @public
     * @return {string}
     */
    getValue: function() {
        var text = this._getTextCtrl();
        return baidu.trim( text.getValue().replace( /\r/g, '' ) );
    },
     
    /**
     * 获取内容数组形式,去重并去除空串内容
     *
     * @public
     * @return {Array}
     */
    getValueAsArray: function () {
        var items       = this.getValue().split( '\n' );
        var len         = items.length;
        var container   = {};
        var result      = [];
        var i;
        var value;
        

        for ( i = 0; i < len; i++ ) {
            value = baidu.trim( items[ i ] );
            if ( value.length === 0 || container[ value ] ) {
                continue;
            }
            container[ value ] = 1;
            result.push( value );
        }

        return result;
    },
    
    /**
     * 释放
     * 
     * @private
     */
    __dispose: function () {
        this._numberInnerEl = null;
        if ( this._numberId ) {
            this._numberId.onscroll = null;
            this._numberId = null;
        }

        var text = this._getTextCtrl();
        text && ( text.main.onscroll = null );

        esui.InputControl.prototype.__dispose.call( this );
    }
}

baidu.inherits( esui.TextLine, esui.InputControl );
