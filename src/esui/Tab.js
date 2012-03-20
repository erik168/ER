/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Tab.js
 * desc:    Tab标签控件
 * author:  zhaolei, erik, wanghuijun
 */

///import esui.Control;
///import baidu.lang.inherits;

/**
 * Tab标签控件
 * 
 * @param {Object} options 控件初始化参数
 */
esui.Tab = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'tab';
    
    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;

    esui.Control.call( this, options );
    
    this.activeIndex    = this.activeIndex || 0;
    this.allowEdit      = !!this.allowEdit;
    this.maxCount       = this.maxCount || esui.Tab.MAX_COUNT || 5;
};

esui.Tab.prototype = {
    /**
     * 渲染控件
     * 
     * @public
     */
    render: function () {
        var me = this;
        esui.Control.prototype.render.call( me );
        
        this.tabs = this.datasource || this.tabs || [];

        // 绘制内容部分
        me._renderTabs();
    },

    _tplItem    : '<li class="{1}"{2}><em>{0}</em>{3}</li>',
    _tplAdd     : '<li class="add" onclick="{0}">+</li>',
    _tplClose   : '<span onclick="{0}"></span>',
    
    /**
     * 绘制标签区
     * 
     * @private
     */
    _renderTabs: function () {
        var me        = this,
            main      = me.main,
            tabs      = me.tabs,
            len       = tabs.length,
            itemClass = me.__getClass( 'item' ),
            html      = [],
            currClass,
            i,
            tab,
            title,
            closeHtml,
            clickHandler;
        
        if ( len == 0 ) {
            main.innerHTML = '';
            return;
        } else if ( len <= me.activeIndex ) {
            me.activeIndex = 0;
        } else if ( me.activeIndex < 0 ) {
            me.activeIndex = 0;
        }
        
        for (i = 0; i < len; i++) {
            tab             = me.tabs[ i ];
            title           = tab.title;
            currClass       = itemClass;
            closeHtml       = '';
            clickHandler    = '';
            
            // 初始化关闭按钮
            if ( me.allowEdit && !tab.stable ) {
                closeHtml = esui.util.format(
                    me.tplClose,
                    me.__getStrCall( '_close', i )
                );
            }

            // 首尾节点增加特殊class
            if ( i == 0 ) { 
                currClass += ' ' + me.__getClass( 'item-first' );
            }
            if ( i == len - 1 ) {
                currClass += ' ' + me.__getClass( 'item-last' );
            }
            
            // 构建tab的样式与行为
            if ( i == me.activeIndex ) {
                currClass += ' ' + me.__getClass( 'item-active' );
            } else {
                clickHandler = ' onclick="' 
                                + me.__getStrCall( '_select', i )
                                + '"';
            }

            // 构建tab项的html
            html.push(
                esui.util.format(
                    me._tplItem, 
                    title, 
                    currClass, 
                    clickHandler, 
                    closeHtml
                ) );
        }

        // 填充tab的html
        main.innerHTML = '<ul>' + html.join('') + '</ul>';
        me._resetPanel();
    },
    
    /**
     * 重置tab对应的panel的显示隐藏状态
     * 
     * @private
     */
    _resetPanel: function () {
        var tabs        = this.tabs;
        var len         = tabs.length;
        var activeIndex = this.activeIndex;
        var i;
        var panel;

        for ( i = 0; i < len; i++ ) {
            panel = tabs[ i ].panel;
            if ( panel ) {
                baidu.g( panel ).style.display = (i == activeIndex ? '' : 'none');
            }
        }
    },

    onchange: new Function(),
    
    /**
     * 选择标签
     * 
     * @private
     * @param {number} index 标签序号
     */
    _select: function ( index ) {
        if ( this.onchange( index, this.tabs[ index ] ) !== false ) {
            this.setActiveIndex( index );
        }
    },
    
    /**
     * 选择标签
     * 
     * @public
     * @param {number} index 标签序号
     */
    setActiveIndex: function ( index ) {
        this.activeIndex = index;
        this._renderTabs();
    },

    onclose: new Function(),
    
    /**
     * 关闭标签
     * 
     * @private
     * @param {number} index 标签序号
     */
    _close: function ( index ) {
        if ( this.onclose( index, this.tabs[ index ] ) !== false ) {
            this.remove( index );
        }
    },
    
    /**
     * 移除标签
     * 
     * @private
     * @param {number} index 标签序号
     */
    remove: function ( index ) {
        var tabs = this.tabs;
        tabs.splice( index, 1 );

        // 重新设置activeIndex
        if ( this.activeIndex >= tabs.length ) {
            this.activeIndex--;
        }
        if ( this.activeIndex < 0 ) {
            this.activeIndex = 0;
        }

        this._renderTabs();
    },
    
    /**
     * 添加标签
     * 
     * @public
     * @param {Object} tab 标签数据
     */
    add: function ( tab ) {
        tab = tab || { title: '新建标签' }
        this.tabs.push( tab );
        this._renderTabs();
    }
};

baidu.inherits( esui.Tab, esui.Control );
