/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Pager.js
 * desc:    分页控件
 * author:  zhaolei, erik, yanjunyi
 */


///import esui.Control;
///import baidu.lang.inherits;

/**
 * @class ui.Pager
 * 页码组件
 */

/**
 * 构造函数
 * 
 * @param {Object} options 控件初始化参数
 */
esui.Pager = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'pager';
    
    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;

    esui.Control.call( this, options );
    
    // Add by junyi @2011-01-24
    // 起始页码数字，即传给后端计算当前页码的偏移量，大多数系统第一页数据的页码索引为0，少数系统为1，即可在此配置，默认：0。
    this.startNumber = parseInt(this.startNumber, 10) || 0;
    
    this.__initOption('prevText', null, 'PREV_TEXT');
    this.__initOption('nextText', null, 'NEXT_TEXT');
    this.__initOption('omitText', null, 'OMIT_TEXT');
    
    this.showCount = parseInt(this.showCount, 10) || esui.Pager.SHOW_COUNT;
};

esui.Pager.SHOW_COUNT = 5;
esui.Pager.OMIT_TEXT  = '…';
esui.Pager.NEXT_TEXT  = '<span class="ui-pager-pntext">下一页</span><span class="ui-pager-icon"></span>';
esui.Pager.PREV_TEXT  =  '<span class="ui-pager-icon"></span><span class="ui-pager-pntext">上一页</span>';

esui.Pager.prototype = {
    /**
     * 获取当前页码
     * 
     * @public
     * @return {string}
     */
    getPage: function () {
        return this.page;
    },
    
    /**
     * 渲染控件
     * 
     * @public
     */
    render: function () {
        var me = this;
        esui.Control.prototype.render.call( me );
        
        me.total = parseInt(me.total, 10) || 0;
        me.page  = parseInt(me.page, 10) || 0;

        // 绘制内容部分
        this._renderPages();
    },
    
    /**
     * @ignore
     */
    _tplMain: '<ul>{0}</ul>',
    /**
     * @ignore
     */
    _tplItem: '<li onclick="{2}" onmouseover="{3}" onmouseout="{4}" class="{1}">{0}</li>',
    
    /**
     * 绘制页码区
     * 
     * @private
     */
    _renderPages: function () {
        var me        = this,
            html      = [],
            total     = me.total,
            startNumber = this.startNumber,
            last      = total + startNumber - 1,
            page      = me.page + startNumber, // 恶心
            itemClass = me.__getClass( 'item' ),
            disClass  = me.__getClass( 'disabled' ),
            prevClass = me.__getClass( 'prev' ),
            nextClass = me.__getClass( 'next' ),
            omitWord  = me._getInfoHtml( me.omitText, me.__getClass( 'omit' ) ),
            i, begin;
        
        if ( total <= 0 ) {
            this.main.innerHTML = '';
            return;
        }
                
        // 计算起始页
        if ( page < me.showCount - 1 ) {
            begin = 0;
        } else if ( page > total - me.showCount ) {
            begin = total - me.showCount;
        } else {
            begin = page - Math.floor( me.showCount / 2 );
        }

        if ( begin < 0 ) {
            begin = 0
        }
        
        // 绘制前一页的link
        if (page > 0) {
            html.push( 
                me._getItemHtml(
                    me.prevText,
                    prevClass,
                    me.__getStrCall( '_setPage', page - 1 )
                ) );
        } else {
            html.push( me._getInfoHtml( me.prevText, prevClass + ' ' + disClass ) );
        }
        
        // 绘制前缀
        if ( begin > 0 ) {
            html.push(
                me._getItemHtml(
                    1,
                    itemClass,
                    this.__getStrCall( '_setPage', 0 )
                ),
                omitWord );
        }

        // 绘制中间的序号
        for ( i = 0; i < me.showCount && begin + i < total; i++ ) {
            if ( begin + i != page ) {
            html.push(
                me._getItemHtml(
                    1 + begin + i,
                    itemClass,
                    me.__getStrCall( '_setPage', begin + i )
                ) );
            } else {
                html.push(
                    me._getInfoHtml(
                        1 + begin + i, 
                        itemClass + ' ' + me.__getClass( 'selected' )
                    ) );
            }
        }
        
        // 绘制后缀
        if ( begin < total - me.showCount ) {
            html.push(
                omitWord,
                me._getItemHtml(
                    total,
                    itemClass,
                    me.__getStrCall( '_setPage', last )
                ) );
        }
        
        
        // 绘制后一页的link
        if ( page < last ) {
            html.push(
                me._getItemHtml(
                    me.nextText,
                    nextClass,
                    me.__getStrCall( '_setPage', page + 1) 
                ) );
        } else {
            html.push( me._getInfoHtml( me.nextText, nextClass + ' ' + disClass ) );
        }
        
        this.main.innerHTML = esui.util.format( me._tplMain, html.join('') );
    },
    
    /**
     * 生成单个页码元素的html内容
     * @private
     * 
     * @param {String} sText
     * @param {Strint} sClass
     * @param {String} sClick
     * 
     * @return {String}
     */
    _getItemHtml: function( sText, sClass, sClick ) {
        var me          = this,
            strRef      = me.__getStrRef(),
            itemOver    = strRef + '._itemOverHandler(this)',
            itemOut     = strRef + '._itemOutHandler(this)';
            
        return esui.util.format(
            me._tplItem,
            sText,
            sClass,
            sClick,
            itemOver,
            itemOut
        );
    },
    
    /**
     * 生成单个不可点击的页码元素的html内容
     * @private
     * 
     * @param {String} sText
     * @param {Strint} sClass
     * 
     * @return {String}
     */
    _getInfoHtml: function ( sText, sClass ) {
        return esui.util.format( this._tplItem, sText, sClass, '', '' ,'' );
    },
    
    /**
     * 点击页码的事件处理接口
     * 
     * @param {Number} page
     * 
     * @return {Boolean}
     */
    onchange: new Function(),
    
    /**
     * 选择页码
     * 
     * @public
     * @param {number} page 选中页数
     */
    _setPage: function ( page ) {
        if ( this.onchange( page ) !== false ) {
            this.setPage( page );
        }
    },

    /**
     * 选择页码
     * 
     * @public
     * @param {number} page 选中页数
     */
    setPage: function ( page ) {
        this.page = page;
        this._renderPages();
    },
    
    /**
     * @ignore
     * @param {Object} item
     */
    _itemOverHandler: function( item ) {
        baidu.addClass( item, this.__getClass( 'hover' ) );
    },

    /**
     * @ignore
     * @param {Object} item
     */
    _itemOutHandler: function( item ) {
        baidu.removeClass( item, this.__getClass( 'hover' ) );
    }
};

baidu.inherits( esui.Pager, esui.Control );
